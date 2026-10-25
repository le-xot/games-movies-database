import { RecordGenre, RecordGrade, RecordStatus, RecordType } from '@backend/enums'
import type { RecordFriendsView } from '@backend/modules/rating/entities/rating-domain.entity'
import type { SelectRow } from '@gmd/database'

export interface CreateRecordData {
  title: string
  posterUrl: string
  genre?: RecordGenre
  link: string
  status?: RecordStatus
  type?: RecordType
  extra?: Record<string, unknown> | null
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
    createdAt: string
    user?: SelectRow<'users'>
  } | null
  likes?: Array<SelectRow<'likes'> & { user?: SelectRow<'users'> }>
}

/** Record row with the friends rating view attached (public aggregate + own vote). */
export type RecordWithFriends = RecordWithRelations & RecordFriendsView

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
