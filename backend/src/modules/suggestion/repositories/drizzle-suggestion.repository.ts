import { DrizzleService } from '@backend/database/drizzle.service'
import { LimitType, RecordGenre, RecordStatus, RecordType } from '@backend/enums'
import { LimitDomain } from '@backend/modules/limit/entities/limit.entity'
import { RecordWithRelations } from '@backend/modules/record/entities/record-domain.entity'
import { DrizzleRecordRepository } from '@backend/modules/record/repositories/drizzle-record.repository'
import { limits, records, suggestionOwnerships } from '@gmd/database/schema'
import { and, count, eq, inArray, or, type SQL } from 'drizzle-orm'

export interface CreateSuggestionData {
  title: string
  posterUrl: string
  genre: RecordGenre
  link: string
}

export interface SuggestionFilters {
  type?: RecordType
  types?: RecordType[]
  statuses?: string[]
}

export class DrizzleSuggestionRepository {
  constructor(
    private readonly drizzle: DrizzleService,
    private readonly recordsRepository: DrizzleRecordRepository,
  ) {}

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

  /** Запись предложения — это обычная запись с владельцем; инвариант живёт в record-репозитории. */
  async createSuggestion(data: CreateSuggestionData, userId: string): Promise<RecordWithRelations> {
    const record = await this.recordsRepository.create({
      title: data.title,
      posterUrl: data.posterUrl,
      genre: data.genre,
      link: data.link,
      status: RecordStatus.QUEUE,
      type: RecordType.SUGGESTION,
      userId,
    })

    const created = await this.drizzle.db.query.records.findFirst({
      where: eq(records.id, record.id),
      with: { suggestionOwnership: true, likes: true },
    })
    if (!created) throw new Error('Failed to load created suggestion')

    return created
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

  /**
   * Удаляет запись со всеми зависимостями через record-репозиторий: ownerships
   * уходят каскадом FK, а likes/recordRatings без этого снега не удалить —
   * они `restrict`. Раньше здесь была своя транзакция, которая забывала
   * `recordRatings` и падала на оценённом предложении.
   */
  async deleteSuggestion(recordId: number): Promise<void> {
    await this.recordsRepository.delete(recordId)
  }
}
