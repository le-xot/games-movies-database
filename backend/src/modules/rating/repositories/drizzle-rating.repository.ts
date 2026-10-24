import crypto from 'node:crypto'
import { recordRatings, records, users } from '@gmd/database/schema'
import { and, count, desc, eq, inArray } from 'drizzle-orm'
import { DrizzleService } from '@/database/drizzle.service'
import { RecordGrade } from '@/enums'
import {
  FriendsAggregate,
  FriendsCounts,
  RatingDomain,
  emptyFriendsCounts,
  getTopGrade,
} from '../entities/rating-domain.entity'
import type { SelectRow } from '@gmd/database'

export interface FriendsMemberRow {
  userId: string
  login: string
  profileImageUrl: string
  counts: FriendsCounts
}

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

  async aggregateByRecords(recordIds: number[]): Promise<Map<number, FriendsAggregate>> {
    const aggregates = new Map<number, FriendsAggregate>()
    if (recordIds.length === 0) return aggregates
    for (const id of recordIds) {
      aggregates.set(id, { counts: emptyFriendsCounts(), total: 0, top: null })
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

  async findByUserWithRecords(
    userId: string,
    grades: RecordGrade[] | undefined,
    skip: number,
    take: number,
  ): Promise<Array<{ rating: RatingDomain; record: SelectRow<'records'> }>> {
    const conditions = [eq(recordRatings.userId, userId)]
    if (grades?.length) conditions.push(inArray(recordRatings.grade, grades))
    const rows = await this.drizzle.db
      .select({ rating: recordRatings, record: records })
      .from(recordRatings)
      .innerJoin(records, eq(recordRatings.recordId, records.id))
      .where(and(...conditions))
      .orderBy(desc(recordRatings.updatedAt))
      .limit(take)
      .offset(skip)
    return rows.map((row) => ({ rating: row.rating, record: row.record }))
  }

  async countByUser(userId: string, grades: RecordGrade[] | undefined): Promise<number> {
    const conditions = [eq(recordRatings.userId, userId)]
    if (grades?.length) conditions.push(inArray(recordRatings.grade, grades))
    const [result] = await this.drizzle.db
      .select({ value: count() })
      .from(recordRatings)
      .where(and(...conditions))
    return result?.value ?? 0
  }

  async getFriendsOverview(): Promise<FriendsMemberRow[]> {
    const rows = await this.drizzle.db
      .select({
        userId: recordRatings.userId,
        login: users.login,
        profileImageUrl: users.profileImageUrl,
        grade: recordRatings.grade,
        value: count(),
      })
      .from(recordRatings)
      .innerJoin(users, eq(recordRatings.userId, users.id))
      .groupBy(recordRatings.userId, users.login, users.profileImageUrl, recordRatings.grade)

    const members = new Map<string, FriendsMemberRow>()
    for (const row of rows) {
      let member = members.get(row.userId)
      if (!member) {
        member = {
          userId: row.userId,
          login: row.login,
          profileImageUrl: row.profileImageUrl,
          counts: emptyFriendsCounts(),
        }
        members.set(row.userId, member)
      }
      member.counts[row.grade] = row.value
    }
    return [...members.values()]
  }
}
