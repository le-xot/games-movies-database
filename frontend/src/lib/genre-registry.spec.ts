import { describe, expect, it } from 'bun:test'
import { RecordGenre } from '@/lib/api'
import { GENRE_QUERY_KEYS } from '@/lib/genre-keys'
import {
  GENRES,
  GENRE_REGISTRY,
  GENRES_BY_PATH,
  NAV_GENRES,
  SUGGESTION_GENRES,
  genreLabel,
} from '@/lib/genre-registry'

describe('genre registry', () => {
  it('описывает каждый жанр из контракта', () => {
    for (const genre of Object.values(RecordGenre)) {
      expect(GENRE_REGISTRY[genre]).toBeDefined()
      expect(GENRE_REGISTRY[genre].genre).toBe(genre)
    }
    expect(GENRES).toHaveLength(Object.values(RecordGenre).length)
  })

  it('держит пути, имена роутов и query-ключи уникальными', () => {
    const paths = GENRES.map((entry) => entry.path)
    const names = GENRES.map((entry) => entry.routeName)
    const keys = GENRES.map((entry) => entry.queryKey)

    expect(new Set(paths).size).toBe(paths.length)
    expect(new Set(names).size).toBe(names.length)
    expect(new Set(keys).size).toBe(keys.length)
    expect(paths.every((path) => path.startsWith('/'))).toBe(true)
  })

  it('назначает подпись и иконку каждому жанру', () => {
    for (const entry of GENRES) {
      expect(entry.label.length).toBeGreaterThan(0)
      expect(entry.icon).toBeTruthy()
      expect(entry.deleteConfirmTitle.endsWith('?')).toBe(true)
    }
    expect(genreLabel(RecordGenre.ANIME)).toBe('Аниме')
    expect(genreLabel(undefined)).toBe('')
  })

  it('содержит все жанры в каждом порядке без дублей', () => {
    for (const order of [GENRES, NAV_GENRES, SUGGESTION_GENRES]) {
      const genres = order.map((entry) => entry.genre)
      expect(new Set(genres)).toEqual(new Set(Object.values(RecordGenre)))
      expect(new Set(genres).size).toBe(genres.length)
    }
  })

  it('держит query-ключ реестра равным листу genre-keys', () => {
    for (const entry of GENRES) {
      expect(entry.queryKey).toBe(GENRE_QUERY_KEYS[entry.genre])
    }
  })

  it('находит запись по пути для прогрева', () => {
    for (const entry of GENRES) {
      expect(GENRES_BY_PATH.get(entry.path)).toBe(entry)
    }
    expect(GENRES_BY_PATH.get('/db/nope')).toBeUndefined()
  })
})
