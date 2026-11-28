import { RecordGenre, RecordGrade, RecordStatus } from '@/lib/api'
import { GENRES } from '@/lib/genre-registry'
import {
  GRADE_REPORT_ORDER,
  GRADE_VOCABULARY,
  STATUS_REPORT_ORDER,
  STATUS_VOCABULARY,
} from '@/lib/record-vocabulary'

/** Порядок и подписи жанров — из единого реестра. */
export const GENRE_ORDER: RecordGenre[] = GENRES.map((entry) => entry.genre)

export const GENRE_LABELS: Record<RecordGenre, string> = Object.fromEntries(
  GENRES.map((entry) => [entry.genre, entry.label]),
) as Record<RecordGenre, string>

// Цвета согласованы с палитрой бейджей (use-badge-select)
export const GENRE_COLORS: Record<RecordGenre, string> = {
  [RecordGenre.GAME]: '#2b593f',
  [RecordGenre.MOVIE]: '#28456c',
  [RecordGenre.ANIME]: '#89632a',
  [RecordGenre.CARTOON]: '#6e3630',
  [RecordGenre.SERIES]: '#4a3b6b',
}

export const STATUS_ORDER: readonly RecordStatus[] = STATUS_REPORT_ORDER

export const STATUS_COLORS: Record<RecordStatus, string> = Object.fromEntries(
  Object.entries(STATUS_VOCABULARY).map(([status, entry]) => [status, entry.tone]),
) as Record<RecordStatus, string>

export const GRADE_ORDER: readonly RecordGrade[] = GRADE_REPORT_ORDER

export const GRADE_COLORS: Record<RecordGrade, string> = Object.fromEntries(
  Object.entries(GRADE_VOCABULARY).map(([grade, entry]) => [grade, entry.tone]),
) as Record<RecordGrade, string>

export function toPercent(count: number, total: number): string {
  if (total <= 0) return '0%'
  return `${((count / total) * 100).toFixed(1)}%`
}

export interface StackedSegment {
  key: string
  label: string
  color: string
  count: number
}

export interface BreakdownCategory {
  key: string
  label: string
  color: string
}

export interface GenreBreakdownRow {
  index: number
  genre: RecordGenre
  label: string
  counts: number[]
}
