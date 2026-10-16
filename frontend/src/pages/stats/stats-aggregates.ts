import {
  GENRE_LABELS,
  GENRE_ORDER,
  type BreakdownCategory,
  type GenreBreakdownRow,
} from '@/pages/stats/constants/stats-constants'
import type { GenreCountDTO, RecordGenre } from '@/lib/api'

export interface GenreAmount {
  genre: RecordGenre
  count: number
}

export interface BreakdownEntry {
  genre: RecordGenre
  key: string
  count: number
}

export function sumCounts(rows: Array<{ count: number }>): number {
  return rows.reduce((sum, row) => sum + row.count, 0)
}

/** Количество по жанрам в порядке GENRE_ORDER; жанры без записей не возвращает. */
export function sumCountsByGenre(rows: GenreAmount[]): GenreCountDTO[] {
  return GENRE_ORDER.flatMap((genre) => {
    const count = sumCounts(rows.filter((row) => row.genre === genre))
    return count > 0 ? [{ genre, count }] : []
  })
}

/** Разрез «жанр × категория»: только жанры с данными, индексы подряд, как в GENRE_ORDER. */
export function buildBreakdownRows(
  entries: BreakdownEntry[],
  categories: BreakdownCategory[],
): GenreBreakdownRow[] {
  return GENRE_ORDER.map((genre) => ({
    genre,
    label: GENRE_LABELS[genre],
    counts: categories.map(
      (category) =>
        entries.find((entry) => entry.genre === genre && entry.key === category.key)?.count ?? 0,
    ),
  }))
    .filter((row) => row.counts.some((count) => count > 0))
    .map((row, index) => ({ index, ...row }))
}
