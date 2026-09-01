import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'
import { BadRequestException } from '@nestjs/common'
import { createMock } from '@/__tests__/helpers/mock-factory'
import { RecordGenre, RecordStatus, RecordType } from '@/enums'
import { RecordDomain } from '@/modules/record/entities/record-domain.entity'
import { RecordsProvidersService } from '../records-providers.service'
import { RecordsProvidersRepository } from '../repositories/records-providers.repository'

const makeMockTwitch = () => ({ getAppAccessToken: mock(() => Promise.resolve('token')) })

const jsonOk = (data: unknown) => Promise.resolve({ ok: true, json: () => Promise.resolve(data) })

type FetchResponder = (url: string) => Promise<{ ok: boolean; json: () => Promise<unknown> }>

function installFetch(responder: FetchResponder) {
  const originalFetch = globalThis.fetch
  globalThis.fetch = mock((input: any) => responder(String(input))) as any
  return () => {
    globalThis.fetch = originalFetch
  }
}

const shikimoriAnime = (overrides: Record<string, unknown> = {}) => ({
  russian: 'Test Anime',
  name: 'Test Anime EN',
  image: { original: '/images/anime/1.jpg' },
  ...overrides,
})

const shikimoriResponder =
  (anime: Record<string, unknown>): FetchResponder =>
  () =>
    jsonOk(anime)

const makeExistingRecord = (overrides: Partial<RecordDomain>): RecordDomain => ({
  id: 1,
  title: 'Test Anime',
  link: 'https://shikimori.one/animes/1',
  posterUrl: '',
  type: RecordType.AUCTION,
  genre: RecordGenre.ANIME,
  ...overrides,
})

function setupRepo(
  repo: RecordsProvidersRepository,
  options: {
    existingRecord?: RecordDomain | null
    permission?: boolean
    rule?: { genre: RecordGenre; permission: boolean } | null
  } = {},
) {
  const findRecordByLinkAndGenre = mock(() =>
    Promise.resolve(options.existingRecord ?? null),
  ) as unknown as RecordsProvidersRepository['findRecordByLinkAndGenre']
  repo.findRecordByLinkAndGenre = findRecordByLinkAndGenre

  const findSuggestionRulesByGenre = mock(() =>
    Promise.resolve(
      options.rule !== undefined
        ? options.rule
        : { genre: RecordGenre.ANIME, permission: options.permission ?? true },
    ),
  ) as unknown as RecordsProvidersRepository['findSuggestionRulesByGenre']
  repo.findSuggestionRulesByGenre = findSuggestionRulesByGenre

  return { findRecordByLinkAndGenre, findSuggestionRulesByGenre }
}

describe('RecordsProvidersService', () => {
  let service: RecordsProvidersService
  let mockRepo: RecordsProvidersRepository

  beforeEach(() => {
    mockRepo = createMock(RecordsProvidersRepository)
    service = new RecordsProvidersService(mockRepo, makeMockTwitch() as any)
  })

  describe('prepareData — duplicate check', () => {
    it('throws when an existing record is found with AUCTION type', async () => {
      const { findRecordByLinkAndGenre } = setupRepo(mockRepo, {
        existingRecord: makeExistingRecord({ id: 1 }),
      })

      const restoreFetch = installFetch(shikimoriResponder(shikimoriAnime()))

      try {
        await expect(
          service.prepareData({ link: 'https://shikimori.one/animes/1' }),
        ).rejects.toThrow(BadRequestException)
        await expect(
          service.prepareData({ link: 'https://shikimori.one/animes/1' }),
        ).rejects.toThrow('Уже есть в аукционе')
        expect(findRecordByLinkAndGenre).toHaveBeenCalledWith(
          'https://shikimori.one/animes/1',
          RecordGenre.ANIME,
        )
      } finally {
        restoreFetch()
      }
    })

    it('throws when an existing record is found with SUGGESTION type', async () => {
      setupRepo(mockRepo, {
        existingRecord: makeExistingRecord({ id: 2, type: RecordType.SUGGESTION }),
      })

      const restoreFetch = installFetch(shikimoriResponder(shikimoriAnime()))

      try {
        await expect(
          service.prepareData({ link: 'https://shikimori.one/animes/2' }),
        ).rejects.toThrow('Уже есть в советах')
      } finally {
        restoreFetch()
      }
    })

    it('throws when an existing record is WRITTEN with DONE status', async () => {
      setupRepo(mockRepo, {
        existingRecord: makeExistingRecord({
          id: 3,
          type: RecordType.WRITTEN,
          status: RecordStatus.DONE,
        }),
      })

      const restoreFetch = installFetch(shikimoriResponder(shikimoriAnime()))

      try {
        await expect(
          service.prepareData({ link: 'https://shikimori.one/animes/3' }),
        ).rejects.toThrow('Уже есть в базе со статусом "Готово"')
      } finally {
        restoreFetch()
      }
    })

    it('throws when an existing record is WRITTEN with DROP status', async () => {
      setupRepo(mockRepo, {
        existingRecord: makeExistingRecord({
          id: 4,
          type: RecordType.WRITTEN,
          status: RecordStatus.DROP,
        }),
      })

      const restoreFetch = installFetch(shikimoriResponder(shikimoriAnime()))

      try {
        await expect(
          service.prepareData({ link: 'https://shikimori.one/animes/4' }),
        ).rejects.toThrow('Уже есть в базе со статусом "Дроп"')
      } finally {
        restoreFetch()
      }
    })

    it('throws when an existing WRITTEN record has null status', async () => {
      setupRepo(mockRepo, {
        existingRecord: makeExistingRecord({
          id: 5,
          type: RecordType.WRITTEN,
          status: null,
        }),
      })

      const restoreFetch = installFetch(shikimoriResponder(shikimoriAnime()))

      try {
        await expect(
          service.prepareData({ link: 'https://shikimori.one/animes/5' }),
        ).rejects.toThrow('Уже есть в базе')
      } finally {
        restoreFetch()
      }
    })

    it('does not throw when no existing record is found', async () => {
      setupRepo(mockRepo)

      const restoreFetch = installFetch(shikimoriResponder(shikimoriAnime()))

      try {
        const result = await service.prepareData({
          link: 'https://shikimori.one/animes/42',
        })
        expect(result.title).toBe('Test Anime')
        expect(result.genre).toBe(RecordGenre.ANIME)
        expect(result.link).toBe('https://shikimori.one/animes/42')
        expect(result.posterUrl).toBe('https://shikimori.one/images/anime/1.jpg')
      } finally {
        restoreFetch()
      }
    })
  })

  describe('prepareData — shikimori mapping', () => {
    it('falls back to name when russian title is missing', async () => {
      setupRepo(mockRepo)

      const restoreFetch = installFetch(
        shikimoriResponder(shikimoriAnime({ russian: undefined, name: 'Fallback Title' })),
      )

      try {
        const result = await service.prepareData({ link: 'https://shikimori.one/animes/7' })
        expect(result.title).toBe('Fallback Title')
      } finally {
        restoreFetch()
      }
    })

    it('normalizes www host', async () => {
      setupRepo(mockRepo)

      const restoreFetch = installFetch(shikimoriResponder(shikimoriAnime()))

      try {
        const result = await service.prepareData({ link: 'https://www.shikimori.one/animes/8' })
        expect(result.link).toBe('https://shikimori.one/animes/8')
      } finally {
        restoreFetch()
      }
    })

    it('throws BadRequestException for unsupported link format', async () => {
      await expect(
        service.prepareData({ link: 'https://unsupported.example.com/abc' }),
      ).rejects.toThrow('Неверный или неподдерживаемый формат ссылки')
    })
  })

  describe('prepareData — kinopoisk', () => {
    const kinopoiskLink = 'https://kinopoisk.ru/film/123'
    let originalKey: string | undefined

    beforeEach(() => {
      originalKey = process.env.KINOPOISK_API
      process.env.KINOPOISK_API = 'test-api-key'
    })

    afterEach(() => {
      if (originalKey === undefined) delete process.env.KINOPOISK_API
      else process.env.KINOPOISK_API = originalKey
    })

    it('maps anime genre to ANIME', async () => {
      setupRepo(mockRepo)

      const restoreFetch = installFetch(() =>
        jsonOk({
          nameRu: 'Аниме Фильм',
          posterUrl: 'http://p',
          genres: [{ genre: 'аниме' }],
          type: 'FILM',
        }),
      )

      try {
        const result = await service.prepareData({ link: kinopoiskLink })
        expect(result.title).toBe('Аниме Фильм')
        expect(result.genre).toBe(RecordGenre.ANIME)
        expect(result.link).toBe('https://www.kinopoisk.ru/film/123')
      } finally {
        restoreFetch()
      }
    })

    it('maps cartoon genre to CARTOON', async () => {
      setupRepo(mockRepo)

      const restoreFetch = installFetch(() =>
        jsonOk({ nameRu: 'Мульт', posterUrl: '', genres: [{ genre: 'мультфильм' }], type: 'FILM' }),
      )

      try {
        const result = await service.prepareData({ link: kinopoiskLink })
        expect(result.genre).toBe(RecordGenre.CARTOON)
      } finally {
        restoreFetch()
      }
    })

    it('maps TV_SERIES type to SERIES with series link path', async () => {
      setupRepo(mockRepo)

      const restoreFetch = installFetch(() =>
        jsonOk({
          nameRu: 'Сериал',
          posterUrl: '',
          genres: [{ genre: 'драма' }],
          type: 'TV_SERIES',
        }),
      )

      try {
        const result = await service.prepareData({ link: kinopoiskLink })
        expect(result.genre).toBe(RecordGenre.SERIES)
        expect(result.link).toBe('https://www.kinopoisk.ru/series/123')
      } finally {
        restoreFetch()
      }
    })

    it('maps plain film to MOVIE', async () => {
      setupRepo(mockRepo)

      const restoreFetch = installFetch(() =>
        jsonOk({ nameRu: 'Фильм', posterUrl: '', genres: [{ genre: 'драма' }], type: 'FILM' }),
      )

      try {
        const result = await service.prepareData({ link: kinopoiskLink })
        expect(result.genre).toBe(RecordGenre.MOVIE)
      } finally {
        restoreFetch()
      }
    })

    it('throws when genres list is empty', async () => {
      setupRepo(mockRepo)

      const restoreFetch = installFetch(() =>
        jsonOk({ nameRu: 'Без жанра', posterUrl: '', genres: [], type: 'FILM' }),
      )

      try {
        await expect(service.prepareData({ link: kinopoiskLink })).rejects.toThrow(
          'Не удалось определить жанр из API Кинопоиска',
        )
      } finally {
        restoreFetch()
      }
    })

    it('throws when KINOPOISK_API is not configured', async () => {
      setupRepo(mockRepo)

      const savedKey = process.env.KINOPOISK_API
      delete process.env.KINOPOISK_API

      try {
        await expect(service.prepareData({ link: kinopoiskLink })).rejects.toThrow(
          'API ключ для Кинопоиска не настроен',
        )
      } finally {
        if (savedKey === undefined) delete process.env.KINOPOISK_API
        else process.env.KINOPOISK_API = savedKey
      }
    })
  })

  describe('prepareData — igdb', () => {
    it('fetches game by slug and maps fields', async () => {
      const { findSuggestionRulesByGenre } = setupRepo(mockRepo)

      const restoreFetch = installFetch((url) => {
        expect(url).toContain('api.igdb.com/v4/games')
        return jsonOk([{ name: 'Portal', cover: { url: '/t_thumb/cover.jpg' }, slug: 'portal' }])
      })

      try {
        const result = await service.prepareData({ link: 'https://www.igdb.com/games/portal' })
        expect(result.title).toBe('Portal')
        expect(result.genre).toBe(RecordGenre.GAME)
        expect(result.posterUrl).toBe('https:/t_cover_big/cover.jpg')
        expect(result.link).toBe('https://www.igdb.com/games/portal')
        expect(findSuggestionRulesByGenre).toHaveBeenCalledWith(RecordGenre.GAME)
      } finally {
        restoreFetch()
      }
    })

    it('resolves steam app id via external_games then fetches the game', async () => {
      setupRepo(mockRepo)

      const restoreFetch = installFetch((url) => {
        if (url.includes('external_games')) return jsonOk([{ game: 620 }])
        return jsonOk([{ name: 'Portal 2', cover: { url: '' }, slug: 'portal-2' }])
      })

      try {
        const result = await service.prepareData({
          link: 'https://store.steampowered.com/app/620',
        })
        expect(result.title).toBe('Portal 2')
        expect(result.link).toBe('https://www.igdb.com/games/portal-2')
      } finally {
        restoreFetch()
      }
    })
  })

  describe('checkGenrePermission — suggestion rules validation', () => {
    it('throws when findSuggestionRulesByGenre returns null', async () => {
      setupRepo(mockRepo, { rule: null })

      const restoreFetch = installFetch(shikimoriResponder(shikimoriAnime()))

      try {
        await expect(
          service.prepareData({ link: 'https://shikimori.one/animes/1' }),
        ).rejects.toThrow('Прошу пока аниме не советовать')
      } finally {
        restoreFetch()
      }
    })

    it('throws when findSuggestionRulesByGenre returns permission=false', async () => {
      setupRepo(mockRepo, { permission: false })

      const restoreFetch = installFetch(shikimoriResponder(shikimoriAnime()))

      try {
        await expect(
          service.prepareData({ link: 'https://shikimori.one/animes/1' }),
        ).rejects.toThrow('Прошу пока аниме не советовать')
      } finally {
        restoreFetch()
      }
    })
  })

  describe('repository method calls', () => {
    it('calls findRecordByLinkAndGenre with correct link and genre from shikimori', async () => {
      const { findRecordByLinkAndGenre } = setupRepo(mockRepo)

      const restoreFetch = installFetch(shikimoriResponder(shikimoriAnime()))

      try {
        await service.prepareData({ link: 'https://shikimori.one/animes/99' })
        expect(findRecordByLinkAndGenre).toHaveBeenCalledWith(
          'https://shikimori.one/animes/99',
          RecordGenre.ANIME,
        )
      } finally {
        restoreFetch()
      }
    })

    it('calls findSuggestionRulesByGenre with ANIME genre for shikimori link', async () => {
      const { findSuggestionRulesByGenre } = setupRepo(mockRepo)

      const restoreFetch = installFetch(shikimoriResponder(shikimoriAnime()))

      try {
        await service.prepareData({ link: 'https://shikimori.one/animes/99' })
        expect(findSuggestionRulesByGenre).toHaveBeenCalledWith(RecordGenre.ANIME)
      } finally {
        restoreFetch()
      }
    })
  })
})
