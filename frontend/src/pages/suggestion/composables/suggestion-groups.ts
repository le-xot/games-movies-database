import { RecordType } from '@/lib/api'
import { SUGGESTION_GENRES } from '@/lib/genre-registry'
import type { RecordEntity, RecordGenre } from '@/lib/api'

export type SuggestionSortBy = 'date' | 'likes'

/** «В очереди» — записи типа WRITTEN, остальные разложены по жанрам. */
export function isQueuedRecord(item: RecordEntity): boolean {
  return item.type === RecordType.WRITTEN
}

/** Ключ группы: `queued` или жанр. */
type SuggestionGroupKey = 'queued' | `${RecordGenre}`

export interface SuggestionGroup {
  key: SuggestionGroupKey
  items: RecordEntity[]
}

function sortItems(items: RecordEntity[], sortBy: SuggestionSortBy): RecordEntity[] {
  return [...items].sort((a, b) =>
    sortBy === 'date'
      ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      : (b.likes?.length ?? 0) - (a.likes?.length ?? 0),
  )
}

/**
 * Группировка ленты советов: «в очереди» первым, дальше жанры в порядке реестра.
 * Чистая функция — тестируется без компонента, компонент держит только разметку.
 */
export function groupSuggestions(
  items: RecordEntity[],
  sortBy: SuggestionSortBy,
): SuggestionGroup[] {
  const queued: RecordEntity[] = []
  const byGenre = new Map<RecordGenre, RecordEntity[]>()

  for (const item of items) {
    if (!item.genre) continue

    if (isQueuedRecord(item)) {
      queued.push(item)
      continue
    }

    const bucket = byGenre.get(item.genre) ?? []
    bucket.push(item)
    byGenre.set(item.genre, bucket)
  }

  const groups: SuggestionGroup[] = []
  if (queued.length > 0) {
    // Очередь — всегда хронология: «лайки» для неё смысла не имеют (как и в прежнем поведении).
    groups.push({ key: 'queued', items: sortItems(queued, 'date') })
  }

  const order = SUGGESTION_GENRES.map((entry) => entry.genre)
  const genreGroups: SuggestionGroup[] = []

  for (const genre of order) {
    const bucket = byGenre.get(genre)
    if (bucket?.length) genreGroups.push({ key: genre, items: sortItems(bucket, sortBy) })
  }

  // Жанр вне SUGGESTION_GENRES не теряем: раньше он рендерился, пусть и в конце.
  for (const [genre, bucket] of byGenre) {
    if (!order.includes(genre)) genreGroups.push({ key: genre, items: sortItems(bucket, sortBy) })
  }

  return groups.concat(genreGroups)
}
