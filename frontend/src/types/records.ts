import type { RecordGenre, RecordGrade, RecordStatus, RecordType } from '@/lib/api'

/**
 * Query params for fetching records from API
 * Note: API expects single values but handles arrays for status/grade on backend
 */
export interface RecordQueryParams {
  id?: number
  title?: string
  link?: string
  posterUrl?: string
  status?: RecordStatus | RecordStatus[]
  type?: RecordType
  genre?: RecordGenre
  grade?: RecordGrade | RecordGrade[]
  episode?: string
  userId?: string
  search?: string
  page?: number
  limit?: number
  orderBy?: string
  direction?: 'asc' | 'desc'
}

/**
 * Filter state for records table
 */
export interface RecordFilterState {
  statusesFilter: RecordStatus[] | null
  gradeFilter: RecordGrade[] | null
}

/**
 * Pagination state for records table
 */
export interface RecordPaginationState {
  pageIndex: number
  pageSize: number
}
