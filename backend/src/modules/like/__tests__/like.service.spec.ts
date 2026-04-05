import { BadRequestException, NotFoundException } from '@nestjs/common'
import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { createMock } from '@/__tests__/helpers/mock-factory'
import { LikeService } from '../like.service'
import { LikeRepository } from '../repositories/like.repository'

const makeLike = (overrides?: Partial<{ id: string; userId: string; recordId: number }>) => ({
  id: 'like-1',
  userId: 'user-1',
  recordId: 1,
  createdAt: new Date(),
  ...overrides,
})

describe('LikeService', () => {
  let service: LikeService
  let mockRepo: LikeRepository
  let mockEventEmitter: { emit: ReturnType<typeof mock> }

  beforeEach(() => {
    mockRepo = createMock(LikeRepository)
    mockEventEmitter = { emit: mock(() => {}) }
    service = new LikeService(mockRepo, mockEventEmitter as any)
  })

  describe('createLike', () => {
    it('creates a like when none exists', async () => {
      const like = makeLike()
      mockRepo.findByUserAndRecord = mock(() => Promise.resolve(null))
      mockRepo.create = mock(() => Promise.resolve(like))

      const result = await service.createLike('user-1', 1)

      expect(mockRepo.findByUserAndRecord).toHaveBeenCalledWith('user-1', 1)
      expect(mockRepo.create).toHaveBeenCalledWith('user-1', 1)
      expect(result).toEqual(like)
    })

    it('emits update-likes event with action created', async () => {
      const like = makeLike()
      mockRepo.findByUserAndRecord = mock(() => Promise.resolve(null))
      mockRepo.create = mock(() => Promise.resolve(like))

      await service.createLike('user-1', 1)

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'update-likes',
        expect.objectContaining({
          userId: 'user-1',
          recordId: 1,
          action: 'created',
        }),
      )
    })

    it('throws BadRequestException if like already exists', async () => {
      mockRepo.findByUserAndRecord = mock(() => Promise.resolve(makeLike()))

      await expect(service.createLike('user-1', 1)).rejects.toThrow(BadRequestException)
      expect(mockRepo.create).not.toHaveBeenCalled()
    })
  })

  describe('deleteLike', () => {
    it('deletes a like and emits event', async () => {
      mockRepo.deleteByUserAndRecord = mock(() => Promise.resolve(1))

      await service.deleteLike('user-1', 1)

      expect(mockRepo.deleteByUserAndRecord).toHaveBeenCalledWith('user-1', 1)
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'update-likes',
        expect.objectContaining({
          userId: 'user-1',
          recordId: 1,
          action: 'deleted',
        }),
      )
    })

    it('throws NotFoundException if nothing was deleted', async () => {
      mockRepo.deleteByUserAndRecord = mock(() => Promise.resolve(0))

      await expect(service.deleteLike('user-1', 1)).rejects.toThrow(NotFoundException)
      expect(mockEventEmitter.emit).not.toHaveBeenCalled()
    })
  })

  describe('getLikesByRecordId', () => {
    it('returns likes and total for a given recordId', async () => {
      const likes = [makeLike(), makeLike({ id: 'like-2', userId: 'user-2' })]
      mockRepo.findByRecord = mock(() => Promise.resolve(likes))

      const result = await service.getLikesByRecordId(1)

      expect(mockRepo.findByRecord).toHaveBeenCalledWith(1)
      expect(result).toEqual({ likes, total: 2 })
    })
  })

  describe('getLikesByUserId', () => {
    it('returns likes and total for a given userId', async () => {
      const likes = [makeLike(), makeLike({ id: 'like-2', recordId: 2 })]
      mockRepo.findByUser = mock(() => Promise.resolve(likes))

      const result = await service.getLikesByUserId('user-1')

      expect(mockRepo.findByUser).toHaveBeenCalledWith('user-1')
      expect(result).toEqual({ likes, total: 2 })
    })
  })

  describe('getLikes', () => {
    it('returns paginated likes with total', async () => {
      const likes = [makeLike()]
      mockRepo.countAll = mock(() => Promise.resolve(5))
      mockRepo.findMany = mock(() => Promise.resolve(likes))

      const result = await service.getLikes(2, 10)

      expect(mockRepo.countAll).toHaveBeenCalled()
      expect(mockRepo.findMany).toHaveBeenCalledWith(10, 10)
      expect(result).toEqual({ likes, total: 5 })
    })

    it('defaults to page 1, limit 10', async () => {
      mockRepo.countAll = mock(() => Promise.resolve(0))
      mockRepo.findMany = mock(() => Promise.resolve([]))

      await service.getLikes()

      expect(mockRepo.findMany).toHaveBeenCalledWith(0, 10)
    })
  })
})
