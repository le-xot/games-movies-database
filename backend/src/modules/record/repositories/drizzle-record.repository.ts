import { likes, records } from '@gmd/database/schema'
import { Injectable } from '@nestjs/common'
import { and, asc, count, desc, eq, ilike, inArray, sql } from 'drizzle-orm'
import { DrizzleService } from '@/database/drizzle.service'
import {
  RecordFilterOptions,
  RecordSortOptions,
  RecordWithRelations,
} from '@/modules/record/entities/record-domain.entity'
import { CreateRecordData, RecordRepository, UpdateRecordData } from './record.repository'

@Injectable()
export class DrizzleRecordRepository extends RecordRepository {
  constructor(private readonly drizzle: DrizzleService) {
    super()
  }

  async create(data: CreateRecordData): Promise<RecordWithRelations> {
    const [record] = await this.drizzle.db
      .insert(records)
      .values({
        title: data.title,
        posterUrl: data.posterUrl,
        genre: data.genre,
        link: data.link,
        status: data.status,
        type: data.type,
        extra: data.extra,
      })
      .returning()
    return record
  }

  async findById(id: number): Promise<RecordWithRelations | null> {
    return (
      (await this.drizzle.db.query.records.findFirst({
        where: eq(records.id, id),
        with: { likes: true },
      })) ?? null
    )
  }

  private buildWhere(filters: RecordFilterOptions) {
    const conditions = []

    if (filters.search) {
      conditions.push(ilike(records.title, `%${filters.search.trim()}%`))
    }
    if (filters.status?.length) conditions.push(inArray(records.status, filters.status))
    if (filters.type) conditions.push(eq(records.type, filters.type))
    if (filters.grade?.length) conditions.push(inArray(records.grade, filters.grade))
    if (filters.genre) conditions.push(eq(records.genre, filters.genre))

    return conditions.length > 0 ? and(...conditions) : undefined
  }

  async findAll(
    filters: RecordFilterOptions,
    sort: RecordSortOptions,
    pagination: { skip: number; take: number },
  ): Promise<RecordWithRelations[]> {
    const column = sort.orderBy === 'title' ? records.title : records.id
    const direction = sort.direction === 'desc' ? desc(column) : asc(column)

    return await this.drizzle.db.query.records.findMany({
      where: this.buildWhere(filters),
      with: { likes: true },
      orderBy: direction,
      limit: pagination.take,
      offset: pagination.skip,
    })
  }

  async count(filters: RecordFilterOptions): Promise<number> {
    const [result] = await this.drizzle.db
      .select({ value: count() })
      .from(records)
      .where(this.buildWhere(filters))
    return result?.value ?? 0
  }

  async update(id: number, data: UpdateRecordData): Promise<RecordWithRelations> {
    return await this.drizzle.db.transaction(async (tx) => {
      await tx.update(records).set(data).where(eq(records.id, id))
      return await tx.query.records.findFirst({
        where: eq(records.id, id),
        with: { likes: true },
      })
    })
  }

  async delete(id: number): Promise<void> {
    await this.drizzle.db.transaction(async (tx) => {
      await tx.delete(likes).where(eq(likes.recordId, id))
      await tx.delete(records).where(eq(records.id, id))
    })
  }

  async findManyByExtraField(key: string): Promise<RecordWithRelations[]> {
    return await this.drizzle.db.query.records.findMany({
      where: sql`jsonb_extract_path_text(${records.extra}, ${key}) is not null`,
      with: { likes: true },
    })
  }
}
