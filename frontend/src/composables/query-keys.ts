import { RecordGenre } from '@/lib/api'

export const STATS_QUERY_KEY = 'stats'
export const SUGGESTION_QUERY_KEY = 'suggestion'
export const WORDLE_LEADERBOARD_KEY = 'wordle/leaderboard'
export const FRIENDS_QUERY_KEY = 'friends'
export const USER_RATINGS_QUERY_KEY = 'user-ratings'
export const COCKTAIL_CATALOG_KEY = 'cocktails/catalog'
export const COCKTAIL_MATCH_KEY = 'cocktails/match'
export const COCKTAIL_BAR_KEY = 'cocktails/bar'

/** Единый источник query-ключей для media-страниц (используется сторами и сокетом). */
export const RECORDS_QUERY_KEYS = {
  [RecordGenre.GAME]: 'games',
  [RecordGenre.MOVIE]: 'movie',
  [RecordGenre.ANIME]: 'anime',
  [RecordGenre.CARTOON]: 'cartoon',
  [RecordGenre.SERIES]: 'series',
} as const satisfies Record<RecordGenre, string>
