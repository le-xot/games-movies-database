import { GENRE_QUERY_KEYS } from '@/lib/genre-keys'

export const STATS_QUERY_KEY = 'stats'
export const WEATHER_QUERY_KEY = 'weather'
export const SUGGESTION_QUERY_KEY = 'suggestion'
export const WORDLE_LEADERBOARD_KEY = 'wordle/leaderboard'
export const FRIENDS_QUERY_KEY = 'friends'
export const USER_RATINGS_QUERY_KEY = 'user-ratings'
export const COCKTAIL_CATALOG_KEY = 'cocktails/catalog'
export const COCKTAIL_MATCH_KEY = 'cocktails/match'
/** Отдельный ключ: выдача поиска запрашивается без порога докупки. */
export const COCKTAIL_SEARCH_KEY = 'cocktails/search'
export const COCKTAIL_BAR_KEY = 'cocktails/bar'

/** Ключи жанровых списков (реэкспорт листа `genre-keys`). */
export const RECORDS_QUERY_KEYS = GENRE_QUERY_KEYS
