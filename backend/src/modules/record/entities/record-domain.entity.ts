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
  grade?: RecordGrade | null
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
  search?: string | undefined
  status?: RecordStatus[] | undefined
  type?: RecordType | undefined
  grade?: RecordGrade[] | undefined
  genre?: RecordGenre | undefined
}

export interface RecordSortOptions {
  orderBy?: 'title' | 'id' | undefined
  direction?: 'asc' | 'desc' | undefined
}
