import { likes, records, suggestionOwnerships } from '@gmd/database/schema'
import { Injectable } from '@nestjs/common'
import { and, asc, count, desc, eq, ilike, inArray } from 'drizzle-orm'
import { DrizzleService } from '@/database/drizzle.service'
import {
  CreateRecordData,
  RecordFilterOptions,
  RecordSortOptions,
  RecordWithRelations,
  UpdateRecordData,
} from '@/modules/record/entities/record-domain.entity'

@Injectable()
export class DrizzleRecordRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async create(data: CreateRecordData): Promise<RecordWithRelations> {
    return await this.drizzle.db.transaction(async (tx) => {
      const [record] = await tx
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

      if (data.userId) {
        await tx.insert(suggestionOwnerships).values({ recordId: record.id, userId: data.userId })
      }

      return record
    })
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
    const values = Object.fromEntries(
      Object.entries(data).filter(([, value]) => value !== undefined),
    ) as UpdateRecordData
    if (Object.keys(values).length === 0) {
      return await this.findById(id)
    }
    return await this.drizzle.db.transaction(async (tx) => {
      await tx.update(records).set(values).where(eq(records.id, id))
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
}
