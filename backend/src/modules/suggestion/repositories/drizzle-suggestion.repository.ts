import { likes, limits, records, suggestionOwnerships } from '@gmd/database/schema'
import { Injectable } from '@nestjs/common'
import { and, count, eq, inArray, or, type SQL } from 'drizzle-orm'
import { DrizzleService } from '@/database/drizzle.service'
import { LimitType, RecordStatus, RecordType } from '@/enums'
import { LimitDomain } from '@/modules/limit/entities/limit.entity'
import { RecordWithRelations } from '@/modules/record/entities/record-domain.entity'
import {
  CreateSuggestionData,
  SuggestionFilters,
  SuggestionRepository,
} from './suggestion.repository'

@Injectable()
export class DrizzleSuggestionRepository extends SuggestionRepository {
  constructor(private readonly drizzle: DrizzleService) {
    super()
  }

  async findLimit(limitType: LimitType): Promise<LimitDomain | null> {
    return (
      (await this.drizzle.db.query.limits.findFirst({ where: eq(limits.name, limitType) })) ?? null
    )
  }

  async countUserSuggestions(userId: string, type: RecordType): Promise<number> {
    const [result] = await this.drizzle.db
      .select({ value: count() })
      .from(suggestionOwnerships)
      .innerJoin(records, eq(suggestionOwnerships.recordId, records.id))
      .where(and(eq(suggestionOwnerships.userId, userId), eq(records.type, type)))
    return result?.value ?? 0
  }

  async createSuggestion(data: CreateSuggestionData, userId: string): Promise<RecordWithRelations> {
    return await this.drizzle.db.transaction(async (tx) => {
      const [record] = await tx
        .insert(records)
        .values({
          title: data.title,
          posterUrl: data.posterUrl,
          genre: data.genre,
          link: data.link,
          status: RecordStatus.QUEUE,
          type: RecordType.SUGGESTION,
        })
        .returning()

      await tx.insert(suggestionOwnerships).values({ recordId: record.id, userId })

      return await tx.query.records.findFirst({
        where: eq(records.id, record.id),
        with: { suggestionOwnership: true, likes: true },
      })
    })
  }

  async findSuggestions(filters: SuggestionFilters): Promise<RecordWithRelations[]> {
    let where: SQL | undefined

    if (filters.types && filters.types.length > 0) {
      where = or(
        ...filters.types.map((type) => {
          if (filters.statuses && filters.statuses.length > 0 && type !== RecordType.SUGGESTION) {
            return and(
              eq(records.type, type),
              inArray(records.status, filters.statuses as RecordStatus[]),
            )
          }
          return eq(records.type, type)
        }),
      )
    } else if (filters.type) {
      where = eq(records.type, filters.type)
    }

    return await this.drizzle.db.query.records.findMany({
      where,
      with: {
        suggestionOwnership: { with: { user: true } },
        likes: { with: { user: true } },
      },
    })
  }

  async findSuggestionById(id: number): Promise<RecordWithRelations | null> {
    return (
      (await this.drizzle.db.query.records.findFirst({
        where: eq(records.id, id),
        with: { suggestionOwnership: true },
      })) ?? null
    )
  }

  async findSuggestionOwner(recordId: number): Promise<{ userId: string } | null> {
    const ownership = await this.drizzle.db.query.suggestionOwnerships.findFirst({
      where: eq(suggestionOwnerships.recordId, recordId),
      columns: { userId: true },
    })
    return ownership ?? null
  }

  async deleteSuggestionWithLikes(recordId: number): Promise<void> {
    await this.drizzle.db.transaction(async (tx) => {
      await tx.delete(likes).where(eq(likes.recordId, recordId))
      await tx.delete(suggestionOwnerships).where(eq(suggestionOwnerships.recordId, recordId))
      await tx.delete(records).where(eq(records.id, recordId))
    })
  }
}
