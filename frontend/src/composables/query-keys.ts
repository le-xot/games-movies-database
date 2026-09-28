import { RecordGenre } from '@/lib/api'

export const STATS_QUERY_KEY = 'stats'
export const SUGGESTION_QUERY_KEY = 'suggestion'
export const WORDLE_LEADERBOARD_KEY = 'wordle/leaderboard'

/** Единый источник query-ключей для media-страниц (используется сторами и сокетом). */
export const RECORDS_QUERY_KEYS = {
  [RecordGenre.GAME]: 'games',
  [RecordGenre.MOVIE]: 'movie',
  [RecordGenre.ANIME]: 'anime',
  [RecordGenre.CARTOON]: 'cartoon',
  [RecordGenre.SERIES]: 'series',
} as const satisfies Record<RecordGenre, string>
