import { RecordGenre, RecordGrade, RecordStatus, RecordType } from '@/enums'
import type { SelectRow } from '@gmd/database'

export interface CreateRecordData {
  title: string
  posterUrl: string
  genre?: RecordGenre
  link: string
  status?: RecordStatus
  type?: RecordType
  extra?: unknown
  userId?: string
}

export interface UpdateRecordData {
  title?: string
  posterUrl?: string
  genre?: RecordGenre
  status?: RecordStatus
  type?: RecordType
  grade?: RecordGrade
  episode?: string
}

export type RecordDomain = SelectRow<'records'>

/** Record row plus the relations loaded by record queries. */
export type RecordWithRelations = RecordDomain & {
  suggestionOwnership?: {
    id: number
    recordId: number
    userId: string
    createdAt: Date
    user?: SelectRow<'users'>
  } | null
  likes?: Array<SelectRow<'likes'> & { user?: SelectRow<'users'> }>
}

export interface RecordFilterOptions {
  search?: string
  status?: RecordStatus[]
  type?: RecordType
  grade?: RecordGrade[]
  genre?: RecordGenre
}

export interface RecordSortOptions {
  orderBy?: 'title' | 'id'
  direction?: 'asc' | 'desc'
}
