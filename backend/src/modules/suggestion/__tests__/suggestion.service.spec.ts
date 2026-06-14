import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common'
import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { createMock } from '@/__tests__/helpers/mock-factory'
import { LimitType, RecordStatus, RecordType } from '@/enums'
import type { LimitDomain } from '@/modules/limit/entities/limit.entity'
import type { RecordWithRelations } from '@/modules/record/entities/record-domain.entity'
import { SuggestionRepository } from '../repositories/suggestion.repository'
import { SuggestionService } from '../suggestion.service'

const makeRecord = (overrides?: Partial<RecordWithRelations>): RecordWithRelations => ({
  id: 1,
  title: 'Test Anime',
  link: 'https://shikimori.one/animes/1',
  posterUrl: 'http://img.example.com/1.jpg',
  status: RecordStatus.QUEUE,
  type: RecordType.SUGGESTION,
  genre: undefined,
  userId: 'user-1',
  ...overrides,
})

describe('SuggestionService', () => {
  let service: SuggestionService
  let mockRepo: SuggestionRepository
  let mockRecordsProvider: { prepareData: ReturnType<typeof mock> }
  let mockEventEmitter: { emit: ReturnType<typeof mock> }

  beforeEach(() => {
    mockRepo = createMock(SuggestionRepository)
    mockRecordsProvider = { prepareData: mock(() => {}) }
    mockEventEmitter = { emit: mock(() => {}) }
    service = new SuggestionService(
      mockRepo,
      mockRecordsProvider as any,
      mockEventEmitter as any,
    )
  })

  describe('userSuggest', () => {
    it('creates a suggestion when under the limit and emits event', async () => {
      const limit: LimitDomain = { name: LimitType.SUGGESTION, quantity: 5 }
      const preparedData = { title: 'Test Anime', posterUrl: 'http://img', genre: RecordType.SUGGESTION as any }
      const createdRecord = makeRecord({ id: 42 })

      mockRepo.findLimit = mock(() => Promise.resolve(limit))
      mockRepo.countUserSuggestions = mock(() => Promise.resolve(2))
      mockRecordsProvider.prepareData = mock(() => Promise.resolve(preparedData))
      mockRepo.createSuggestion = mock(() => Promise.resolve(createdRecord))

      const result = await service.userSuggest({ link: 'https://shikimori.one/animes/1', userId: 'user-1' })

      expect(mockRepo.findLimit).toHaveBeenCalledWith(LimitType.SUGGESTION)
      expect(mockRepo.countUserSuggestions).toHaveBeenCalledWith('user-1', RecordType.SUGGESTION)
      expect(mockRepo.createSuggestion).toHaveBeenCalledTimes(1)
      expect(result).toEqual({ title: 'Test Anime', genre: RecordType.SUGGESTION as any })
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'update-suggestions',
        expect.objectContaining({ id: 42, action: 'created' }),
      )
    })

    it('throws BadRequestException when suggestion count meets the limit', async () => {
      const limit: LimitDomain = { name: LimitType.SUGGESTION, quantity: 3 }

      mockRepo.findLimit = mock(() => Promise.resolve(limit))
      mockRepo.countUserSuggestions = mock(() => Promise.resolve(3))

      await expect(
        service.userSuggest({ link: 'https://shikimori.one/animes/1', userId: 'user-1' }),
      ).rejects.toThrow(BadRequestException)

      expect(mockRepo.createSuggestion).not.toHaveBeenCalled()
    })
  })

  describe('getSuggestions', () => {
    it('returns suggestions via repository', async () => {
      const suggestions = [makeRecord(), makeRecord({ id: 2 })]
      mockRepo.findSuggestions = mock(() => Promise.resolve(suggestions))

      const result = await service.getSuggestions()

      expect(mockRepo.findSuggestions).toHaveBeenCalledWith({ type: RecordType.SUGGESTION })
      expect(result).toEqual(suggestions as any)
    })
  })

  describe('deleteUserSuggestion', () => {
    it('deletes the suggestion and emits event when ownership is valid', async () => {
      const suggestion = makeRecord({ id: 5, userId: 'user-1', type: RecordType.SUGGESTION })
      mockRepo.findSuggestionById = mock(() => Promise.resolve(suggestion))
      mockRepo.deleteSuggestionWithLikes = mock(() => Promise.resolve())

      await service.deleteUserSuggestion(5, 'user-1')

      expect(mockRepo.findSuggestionById).toHaveBeenCalledWith(5)
      expect(mockRepo.deleteSuggestionWithLikes).toHaveBeenCalledWith(5)
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'update-suggestions',
        expect.objectContaining({ id: 5, action: 'deleted' }),
      )
    })

    it('throws NotFoundException when suggestion does not exist', async () => {
      mockRepo.findSuggestionById = mock(() => Promise.resolve(null))

      await expect(service.deleteUserSuggestion(99, 'user-1')).rejects.toThrow(NotFoundException)
      expect(mockRepo.deleteSuggestionWithLikes).not.toHaveBeenCalled()
    })

    it('throws ForbiddenException when userId does not match', async () => {
      const suggestion = makeRecord({ id: 5, userId: 'other-user', type: RecordType.SUGGESTION })
      mockRepo.findSuggestionById = mock(() => Promise.resolve(suggestion))

      await expect(service.deleteUserSuggestion(5, 'user-1')).rejects.toThrow(ForbiddenException)
      expect(mockRepo.deleteSuggestionWithLikes).not.toHaveBeenCalled()
    })

    it('throws BadRequestException when record is not a suggestion', async () => {
      const record = makeRecord({ id: 5, userId: 'user-1', type: RecordType.WRITTEN })
      mockRepo.findSuggestionById = mock(() => Promise.resolve(record))

      await expect(service.deleteUserSuggestion(5, 'user-1')).rejects.toThrow(BadRequestException)
      expect(mockRepo.deleteSuggestionWithLikes).not.toHaveBeenCalled()
    })
  })
})
