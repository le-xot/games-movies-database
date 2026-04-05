import { RecordGenre, RecordGrade, RecordStatus, RecordType, UserRole } from '@/enums'

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
  userId?: string
  createdAt?: Date
}

export interface RecordWithRelations extends RecordDomain {
  user?: {
    id: string
    login: string
    role: UserRole
    profileImageUrl: string
    color: string
    createdAt: Date
  }
  likes?: Array<{ id: string; userId: string; recordId: number; createdAt: Date }>
}

export interface RecordFilterOptions {
  search?: string; // case-insensitive on title and user login
  status?: RecordStatus;
  type?: RecordType;
  grade?: RecordGrade;
  genre?: RecordGenre;
  userId?: string;
}

export interface RecordSortOptions {
  orderBy?: 'title' | 'id';
  direction?: 'asc' | 'desc';
}
