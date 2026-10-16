import { expect, it } from 'bun:test'
import { records } from '@gmd/database/schema'
import { RecordGrade } from '@/enums'
import { DrizzleRatingRepository } from '@/modules/rating/repositories/drizzle-rating.repository'
import { DrizzleRecordRepository } from '@/modules/record/repositories/drizzle-record.repository'
import { seedRecord, seedUser } from './helpers/fixtures'
import { setupIntegrationSuite } from './helpers/suite'
import type { DrizzleService } from '@/database/drizzle.service'

setupIntegrationSuite('DrizzleRatingRepository (integration)', ({ db }) => {
  const drizzle = { db } as unknown as DrizzleService
  const ratings = new DrizzleRatingRepository(drizzle)
  const recordsRepo = new DrizzleRecordRepository(drizzle)

  it('upserts one vote per user and aggregates counts with top grade', async () => {
    const user1 = await seedUser(db, 'rater-1')
    const user2 = await seedUser(db, 'rater-2')
    const [record] = await db
      .insert(records)
      .values(seedRecord({ title: 'Rated' }))
      .returning()
    if (!record) throw new Error('seed record failed')

    await ratings.upsert(user1.id, record.id, RecordGrade.LIKE)
    await ratings.upsert(user2.id, record.id, RecordGrade.RECOMMEND)
    await ratings.upsert(user1.id, record.id, RecordGrade.RECOMMEND)

    const aggregates = await ratings.aggregateByRecords([record.id])
    const aggregate = aggregates.get(record.id)
    expect(aggregate?.total).toBe(2)
    expect(aggregate?.counts[RecordGrade.RECOMMEND]).toBe(2)
    expect(aggregate?.counts[RecordGrade.LIKE]).toBe(0)
    expect(aggregate?.top).toBe(RecordGrade.RECOMMEND)

    const mine = await ratings.findMyGrades(user1.id, [record.id])
    expect(mine.get(record.id)).toBe(RecordGrade.RECOMMEND)
  })

  it('deletes a single vote and reports zero on repeat', async () => {
    const user = await seedUser(db, 'rater-vote')
    const [record] = await db
      .insert(records)
      .values(seedRecord({ title: 'Voted' }))
      .returning()
    if (!record) throw new Error('seed record failed')
    await ratings.upsert(user.id, record.id, RecordGrade.BEER)

    expect(await ratings.deleteByUserAndRecord(user.id, record.id)).toBe(1)
    expect(await ratings.findByUserAndRecord(user.id, record.id)).toBeNull()
    expect(await ratings.deleteByUserAndRecord(user.id, record.id)).toBe(0)
  })

  it('removes ratings when the record is deleted', async () => {
    const user = await seedUser(db, 'rater-3')
    const [record] = await db
      .insert(records)
      .values(seedRecord({ title: 'Doomed' }))
      .returning()
    if (!record) throw new Error('seed record failed')
    await ratings.upsert(user.id, record.id, RecordGrade.BEER)

    await recordsRepo.delete(record.id)

    expect(await ratings.findByUserAndRecord(user.id, record.id)).toBeNull()
    const aggregates = await ratings.aggregateByRecords([record.id])
    expect(aggregates.get(record.id)?.total).toBe(0)
  })

  it('lists a user votes with records, grade filter and count', async () => {
    const user = await seedUser(db, 'rater-list')
    const other = await seedUser(db, 'rater-other')
    const [first, second] = await db
      .insert(records)
      .values([seedRecord({ title: 'First' }), seedRecord({ title: 'Second' })])
      .returning()
    if (!first || !second) throw new Error('seed record failed')
    await ratings.upsert(user.id, first.id, RecordGrade.LIKE)
    await ratings.upsert(user.id, second.id, RecordGrade.DISLIKE)
    await ratings.upsert(other.id, first.id, RecordGrade.RECOMMEND)

    const rows = await ratings.findByUserWithRecords(user.id, [RecordGrade.LIKE], 0, 10)
    expect(rows.map((row) => [row.record.title, row.rating.grade])).toEqual([
      ['First', RecordGrade.LIKE],
    ])

    expect(await ratings.countByUser(user.id, undefined)).toBe(2)
    expect(await ratings.countByUser(user.id, [RecordGrade.DISLIKE])).toBe(1)

    const page = await ratings.findByUserWithRecords(user.id, undefined, 1, 1)
    expect(page).toHaveLength(1)
  })
})
