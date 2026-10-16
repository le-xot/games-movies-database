import crypto from 'node:crypto'
import { recordRatings } from '@gmd/database/schema'
import { Injectable } from '@nestjs/common'
import { and, count, eq, inArray } from 'drizzle-orm'
import { DrizzleService } from '@/database/drizzle.service'
import { RecordGrade } from '@/enums'
import {
  CommunityAggregate,
  RatingDomain,
  emptyCommunityCounts,
  getTopGrade,
} from '../entities/rating-domain.entity'

@Injectable()
export class DrizzleRatingRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async findByUserAndRecord(userId: string, recordId: number): Promise<RatingDomain | null> {
    return (
      (await this.drizzle.db.query.recordRatings.findFirst({
        where: and(eq(recordRatings.userId, userId), eq(recordRatings.recordId, recordId)),
      })) ?? null
    )
  }

  async upsert(userId: string, recordId: number, grade: RecordGrade): Promise<RatingDomain> {
    const [rating] = await this.drizzle.db
      .insert(recordRatings)
      .values({ id: crypto.randomUUID(), userId, recordId, grade })
      .onConflictDoUpdate({
        target: [recordRatings.userId, recordRatings.recordId],
        set: { grade, updatedAt: new Date() },
      })
      .returning()
    if (!rating) throw new Error('Failed to upsert rating')
    return rating
  }

  async deleteByUserAndRecord(userId: string, recordId: number): Promise<number> {
    const result = await this.drizzle.db
      .delete(recordRatings)
      .where(and(eq(recordRatings.userId, userId), eq(recordRatings.recordId, recordId)))
    return result.rowCount ?? 0
  }

  async aggregateByRecords(recordIds: number[]): Promise<Map<number, CommunityAggregate>> {
    const aggregates = new Map<number, CommunityAggregate>()
    if (recordIds.length === 0) return aggregates
    for (const id of recordIds) {
      aggregates.set(id, { counts: emptyCommunityCounts(), total: 0, top: null })
    }
    const rows = await this.drizzle.db
      .select({ recordId: recordRatings.recordId, grade: recordRatings.grade, count: count() })
      .from(recordRatings)
      .where(inArray(recordRatings.recordId, recordIds))
      .groupBy(recordRatings.recordId, recordRatings.grade)
    for (const row of rows) {
      const aggregate = aggregates.get(row.recordId)
      if (!aggregate) continue
      aggregate.counts[row.grade] = row.count
      aggregate.total += row.count
    }
    for (const aggregate of aggregates.values()) {
      aggregate.top = getTopGrade(aggregate.counts)
    }
    return aggregates
  }

  async findMyGrades(userId: string, recordIds: number[]): Promise<Map<number, RecordGrade>> {
    const grades = new Map<number, RecordGrade>()
    if (recordIds.length === 0) return grades
    const rows = await this.drizzle.db
      .select({ recordId: recordRatings.recordId, grade: recordRatings.grade })
      .from(recordRatings)
      .where(and(eq(recordRatings.userId, userId), inArray(recordRatings.recordId, recordIds)))
    for (const row of rows) {
      grades.set(row.recordId, row.grade)
    }
    return grades
  }
}
