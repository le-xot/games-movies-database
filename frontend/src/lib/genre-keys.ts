import { RecordGenre } from '@/lib/api'

/**
 * Query-ключи жанровых списков. Отдельный лист без зависимостей: на него
 * ссылаются и сторы, и реестр жанров, и WS-инвалидация — без цикла модулей.
 */
export const GENRE_QUERY_KEYS = {
  [RecordGenre.GAME]: 'games',
  [RecordGenre.MOVIE]: 'movie',
  [RecordGenre.ANIME]: 'anime',
  [RecordGenre.CARTOON]: 'cartoon',
  [RecordGenre.SERIES]: 'series',
} as const satisfies Record<RecordGenre, string>
