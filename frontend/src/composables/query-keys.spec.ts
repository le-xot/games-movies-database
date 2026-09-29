import { describe, expect, it } from 'bun:test'
import { RECORDS_QUERY_KEYS } from '@/composables/query-keys'

describe('RECORDS_QUERY_KEYS', () => {
  it('maps every genre to its query key', () => {
    expect(RECORDS_QUERY_KEYS).toEqual({
      GAME: 'games',
      MOVIE: 'movie',
      ANIME: 'anime',
      CARTOON: 'cartoon',
      SERIES: 'series',
    })
  })
})
