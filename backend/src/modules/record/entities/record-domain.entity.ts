import { RecordGenre, RecordGrade, RecordStatus, RecordType } from '@/enums'

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
  createdAt?: Date
}

export interface RecordWithRelations extends RecordDomain {
  likes?: Array<{ id: string; userId: string; recordId: number; createdAt: Date }>
}

export interface RecordFilterOptions {
  search?: string;
  status?: RecordStatus;
  type?: RecordType;
  grade?: RecordGrade;
  genre?: RecordGenre;
}

export interface RecordSortOptions {
  orderBy?: 'title' | 'id';
  direction?: 'asc' | 'desc';
}
