import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { BadRequestException } from '@nestjs/common'
import { createMock } from '@/__tests__/helpers/mock-factory'
import { RecordGenre, RecordStatus, RecordType } from '@/enums'
import { RecordDomain } from '@/modules/record/entities/record-domain.entity'
import { RecordsProvidersRepository } from '../repositories/records-providers.repository'
import { RecordsProvidersService } from '../records-providers.service'

const makeMockTwitch = () => ({ getAppAccessToken: mock(() => Promise.resolve('token')) })

describe('RecordsProvidersService', () => {
  let service: RecordsProvidersService
  let mockRepo: RecordsProvidersRepository

  beforeEach(() => {
    mockRepo = createMock(RecordsProvidersRepository)
    service = new RecordsProvidersService(mockRepo, makeMockTwitch() as any)
  })

  describe('prepareData — duplicate check', () => {
    it('throws when an existing record is found with AUCTION type', async () => {
      const existingRecord: RecordDomain = {
        id: 1,
        title: 'Test Anime',
        link: 'https://shikimori.one/animes/1',
        posterUrl: '',
        type: RecordType.AUCTION,
        genre: RecordGenre.ANIME,
      }

      const findRecordByLinkAndGenre = mock(() =>
        Promise.resolve(existingRecord),
      ) as unknown as RecordsProvidersRepository['findRecordByLinkAndGenre']
      mockRepo.findRecordByLinkAndGenre = findRecordByLinkAndGenre

      const findSuggestionRulesByGenre = mock(() =>
        Promise.resolve({ genre: RecordGenre.ANIME, permission: true }),
      ) as unknown as RecordsProvidersRepository['findSuggestionRulesByGenre']
      mockRepo.findSuggestionRulesByGenre = findSuggestionRulesByGenre

      const originalFetch = globalThis.fetch
      globalThis.fetch = mock(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              data: { animes: [{ russian: 'Test Anime', poster: { originalUrl: '' } }] },
            }),
        }),
      ) as any

      try {
        await expect(
          service.prepareData({ link: 'https://shikimori.one/animes/1', userId: 'user1' }),
        ).rejects.toThrow(BadRequestException)
        await expect(
          service.prepareData({ link: 'https://shikimori.one/animes/1', userId: 'user1' }),
        ).rejects.toThrow('Уже есть в аукционе')
      } finally {
        globalThis.fetch = originalFetch
      }
    })

    it('throws when an existing record is found with SUGGESTION type', async () => {
      const existingRecord: RecordDomain = {
        id: 2,
        title: 'Test Anime',
        link: 'https://shikimori.one/animes/2',
        posterUrl: '',
        type: RecordType.SUGGESTION,
        genre: RecordGenre.ANIME,
      }

      mockRepo.findRecordByLinkAndGenre = mock(() =>
        Promise.resolve(existingRecord),
      ) as unknown as RecordsProvidersRepository['findRecordByLinkAndGenre']
      mockRepo.findSuggestionRulesByGenre = mock(() =>
        Promise.resolve({ genre: RecordGenre.ANIME, permission: true }),
      ) as unknown as RecordsProvidersRepository['findSuggestionRulesByGenre']

      const originalFetch = globalThis.fetch
      globalThis.fetch = mock(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              data: { animes: [{ russian: 'Test Anime', poster: { originalUrl: '' } }] },
            }),
        }),
      ) as any

      try {
        await expect(
          service.prepareData({ link: 'https://shikimori.one/animes/2', userId: 'user1' }),
        ).rejects.toThrow('Уже есть в советах')
      } finally {
        globalThis.fetch = originalFetch
      }
    })

    it('throws when an existing record is WRITTEN with DONE status', async () => {
      const existingRecord: RecordDomain = {
        id: 3,
        title: 'Test Anime',
        link: 'https://shikimori.one/animes/3',
        posterUrl: '',
        type: RecordType.WRITTEN,
        status: RecordStatus.DONE,
        genre: RecordGenre.ANIME,
      }

      mockRepo.findRecordByLinkAndGenre = mock(() =>
        Promise.resolve(existingRecord),
      ) as unknown as RecordsProvidersRepository['findRecordByLinkAndGenre']
      mockRepo.findSuggestionRulesByGenre = mock(() =>
        Promise.resolve({ genre: RecordGenre.ANIME, permission: true }),
      ) as unknown as RecordsProvidersRepository['findSuggestionRulesByGenre']

      const originalFetch = globalThis.fetch
      globalThis.fetch = mock(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              data: { animes: [{ russian: 'Test Anime', poster: { originalUrl: '' } }] },
            }),
        }),
      ) as any

      try {
        await expect(
          service.prepareData({ link: 'https://shikimori.one/animes/3', userId: 'user1' }),
        ).rejects.toThrow('Уже есть в базе со статусом "Готово"')
      } finally {
        globalThis.fetch = originalFetch
      }
    })

    it('does not throw when no existing record is found', async () => {
      mockRepo.findRecordByLinkAndGenre = mock(() =>
        Promise.resolve(null),
      ) as unknown as RecordsProvidersRepository['findRecordByLinkAndGenre']
      mockRepo.findSuggestionRulesByGenre = mock(() =>
        Promise.resolve({ genre: RecordGenre.ANIME, permission: true }),
      ) as unknown as RecordsProvidersRepository['findSuggestionRulesByGenre']

      const originalFetch = globalThis.fetch
      globalThis.fetch = mock(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              data: { animes: [{ russian: 'Test Anime', poster: { originalUrl: 'http://img' } }] },
            }),
        }),
      ) as any

      try {
        const result = await service.prepareData({
          link: 'https://shikimori.one/animes/42',
          userId: 'user1',
        })
        expect(result.title).toBe('Test Anime')
        expect(result.genre).toBe(RecordGenre.ANIME)
      } finally {
        globalThis.fetch = originalFetch
      }
    })
  })

  describe('checkGenrePermission — suggestion rules validation', () => {
    it('throws when findSuggestionRulesByGenre returns null', async () => {
      mockRepo.findRecordByLinkAndGenre = mock(() =>
        Promise.resolve(null),
      ) as unknown as RecordsProvidersRepository['findRecordByLinkAndGenre']
      mockRepo.findSuggestionRulesByGenre = mock(() =>
        Promise.resolve(null),
      ) as unknown as RecordsProvidersRepository['findSuggestionRulesByGenre']

      const originalFetch = globalThis.fetch
      globalThis.fetch = mock(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              data: { animes: [{ russian: 'Test Anime', poster: { originalUrl: '' } }] },
            }),
        }),
      ) as any

      try {
        await expect(
          service.prepareData({ link: 'https://shikimori.one/animes/1', userId: 'user1' }),
        ).rejects.toThrow(BadRequestException)
        await expect(
          service.prepareData({ link: 'https://shikimori.one/animes/1', userId: 'user1' }),
        ).rejects.toThrow('Прошу пока аниме не советовать')
      } finally {
        globalThis.fetch = originalFetch
      }
    })

    it('throws when findSuggestionRulesByGenre returns permission=false', async () => {
      mockRepo.findRecordByLinkAndGenre = mock(() =>
        Promise.resolve(null),
      ) as unknown as RecordsProvidersRepository['findRecordByLinkAndGenre']
      mockRepo.findSuggestionRulesByGenre = mock(() =>
        Promise.resolve({ genre: RecordGenre.ANIME, permission: false }),
      ) as unknown as RecordsProvidersRepository['findSuggestionRulesByGenre']

      const originalFetch = globalThis.fetch
      globalThis.fetch = mock(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              data: { animes: [{ russian: 'Test Anime', poster: { originalUrl: '' } }] },
            }),
        }),
      ) as any

      try {
        await expect(
          service.prepareData({ link: 'https://shikimori.one/animes/1', userId: 'user1' }),
        ).rejects.toThrow('Прошу пока аниме не советовать')
      } finally {
        globalThis.fetch = originalFetch
      }
    })

    it('throws BadRequestException for unsupported link format', async () => {
      await expect(
        service.prepareData({ link: 'https://unsupported.example.com/abc', userId: 'user1' }),
      ).rejects.toThrow('Неверный или неподдерживаемый формат ссылки')
    })
  })

  describe('repository method calls', () => {
    it('calls findRecordByLinkAndGenre with correct link and genre from shikimori', async () => {
      const findRecordByLinkAndGenre = mock(() =>
        Promise.resolve(null),
      ) as unknown as RecordsProvidersRepository['findRecordByLinkAndGenre']
      mockRepo.findRecordByLinkAndGenre = findRecordByLinkAndGenre

      mockRepo.findSuggestionRulesByGenre = mock(() =>
        Promise.resolve({ genre: RecordGenre.ANIME, permission: true }),
      ) as unknown as RecordsProvidersRepository['findSuggestionRulesByGenre']

      const originalFetch = globalThis.fetch
      globalThis.fetch = mock(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              data: { animes: [{ russian: 'My Anime', poster: { originalUrl: 'http://img' } }] },
            }),
        }),
      ) as any

      try {
        await service.prepareData({ link: 'https://shikimori.one/animes/99', userId: 'user1' })
        expect(findRecordByLinkAndGenre).toHaveBeenCalledWith(
          'https://shikimori.one/animes/99',
          RecordGenre.ANIME,
        )
      } finally {
        globalThis.fetch = originalFetch
      }
    })

    it('calls findSuggestionRulesByGenre with ANIME genre for shikimori link', async () => {
      mockRepo.findRecordByLinkAndGenre = mock(() =>
        Promise.resolve(null),
      ) as unknown as RecordsProvidersRepository['findRecordByLinkAndGenre']

      const findSuggestionRulesByGenre = mock(() =>
        Promise.resolve({ genre: RecordGenre.ANIME, permission: true }),
      ) as unknown as RecordsProvidersRepository['findSuggestionRulesByGenre']
      mockRepo.findSuggestionRulesByGenre = findSuggestionRulesByGenre

      const originalFetch = globalThis.fetch
      globalThis.fetch = mock(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              data: { animes: [{ russian: 'My Anime', poster: { originalUrl: 'http://img' } }] },
            }),
        }),
      ) as any

      try {
        await service.prepareData({ link: 'https://shikimori.one/animes/99', userId: 'user1' })
        expect(findSuggestionRulesByGenre).toHaveBeenCalledWith(RecordGenre.ANIME)
      } finally {
        globalThis.fetch = originalFetch
      }
    })
  })
})
