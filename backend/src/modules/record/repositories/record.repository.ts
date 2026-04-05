import {
  RecordFilterOptions,
  RecordSortOptions,
  RecordWithRelations,
} from '@/modules/record/entities/record-domain.entity'

export interface CreateRecordData {
  title: string
  posterUrl: string
  genre?: string
  link: string
  status?: string
  type?: string
  userId: string
}

export interface UpdateRecordData {
  title?: string
  posterUrl?: string
  genre?: string
  status?: string
  type?: string
  grade?: string
  episode?: string
}

export abstract class RecordRepository {
  abstract create(data: CreateRecordData): Promise<RecordWithRelations>
  abstract findById(id: number): Promise<RecordWithRelations | null>
  abstract findAll(
    filters: RecordFilterOptions,
    sort: RecordSortOptions,
    pagination: { skip: number; take: number },
  ): Promise<RecordWithRelations[]>
  abstract count(filters: RecordFilterOptions): Promise<number>
  abstract update(id: number, data: UpdateRecordData): Promise<RecordWithRelations>
  abstract delete(id: number): Promise<void>
}
