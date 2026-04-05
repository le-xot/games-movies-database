import { RecordGenre, RecordGrade, RecordStatus, RecordType } from '@/enums';

export interface RecordDomain {
  id: number;
  title: string;
  link: string;
  posterUrl: string;
  status?: RecordStatus;
  type?: RecordType;
  genre?: RecordGenre;
  grade?: RecordGrade;
  episode?: string;
  userId?: string;
}

export interface RecordWithRelations extends RecordDomain {
  user?: { id: string; login: string; displayName: string; avatarUrl: string };
  likes?: Array<{ id: string; userId: string; recordId: number; createdAt: Date }>;
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
