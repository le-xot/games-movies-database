import { RecordGenre, RecordGrade, RecordStatus, RecordType, UserRole } from '@/enums'

export interface CreateRecordData {
  title: string
  posterUrl: string
  genre?: RecordGenre
  link: string
  status?: RecordStatus
  type?: RecordType
  extra?: unknown
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

export interface RecordDomain {
  id: number
  title: string
  link: string
  posterUrl: string
  status?: RecordStatus
  type?: RecordType
  genre?: RecordGenre
  grade?: RecordGrade
  episode?: string
  extra?: unknown | null
  createdAt?: Date
}

export interface RecordWithRelations extends RecordDomain {
  suggestionOwnership?: {
    id: number
    userId: string
    user?: {
      id: string
      login: string
      role: UserRole
      profileImageUrl: string
      color: string
      createdAt: Date
    }
  } | null
  likes?: Array<{
    id: string
    userId: string
    recordId: number
    createdAt: Date
    user?: { id: string; login: string; profileImageUrl: string; color: string }
  }>
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
