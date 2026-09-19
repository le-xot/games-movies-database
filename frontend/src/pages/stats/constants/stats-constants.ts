import { RecordGenre, RecordGrade, RecordStatus } from '@/lib/api'

export const GENRE_ORDER: RecordGenre[] = [
  RecordGenre.GAME,
  RecordGenre.MOVIE,
  RecordGenre.ANIME,
  RecordGenre.CARTOON,
  RecordGenre.SERIES,
]

export const GENRE_LABELS: Record<RecordGenre, string> = {
  [RecordGenre.GAME]: 'Игры',
  [RecordGenre.MOVIE]: 'Фильмы',
  [RecordGenre.ANIME]: 'Аниме',
  [RecordGenre.CARTOON]: 'Мультфильмы',
  [RecordGenre.SERIES]: 'Сериалы',
}

// Цвета согласованы с палитрой бейджей (use-badge-select)
export const GENRE_COLORS: Record<RecordGenre, string> = {
  [RecordGenre.GAME]: '#2b593f',
  [RecordGenre.MOVIE]: '#28456c',
  [RecordGenre.ANIME]: '#89632a',
  [RecordGenre.CARTOON]: '#6e3630',
  [RecordGenre.SERIES]: '#4a3b6b',
}

export const STATUS_ORDER: RecordStatus[] = [
  RecordStatus.DONE,
  RecordStatus.PROGRESS,
  RecordStatus.QUEUE,
  RecordStatus.UNFINISHED,
  RecordStatus.DROP,
]

export const STATUS_COLORS: Record<RecordStatus, string> = {
  [RecordStatus.DONE]: '#2b593f',
  [RecordStatus.PROGRESS]: '#89632a',
  [RecordStatus.QUEUE]: '#333333',
  [RecordStatus.UNFINISHED]: '#28456c',
  [RecordStatus.DROP]: '#6e3630',
  [RecordStatus.NOTINTERESTED]: '#4a4a4a',
}

export const GRADE_ORDER: RecordGrade[] = [
  RecordGrade.RECOMMEND,
  RecordGrade.LIKE,
  RecordGrade.BEER,
  RecordGrade.DISLIKE,
]

export const GRADE_COLORS: Record<RecordGrade, string> = {
  [RecordGrade.RECOMMEND]: '#28456c',
  [RecordGrade.LIKE]: '#2b593f',
  [RecordGrade.BEER]: '#89632a',
  [RecordGrade.DISLIKE]: '#6e3630',
}

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
