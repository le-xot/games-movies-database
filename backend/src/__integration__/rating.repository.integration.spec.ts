import { expect, it } from 'bun:test'
import { RecordGrade } from '@backend/enums'
import { DrizzleRatingRepository } from '@backend/modules/rating/repositories/drizzle-rating.repository'
import { DrizzleRecordRepository } from '@backend/modules/record/repositories/drizzle-record.repository'
import { records } from '@gmd/database/schema'
import { seedRecord, seedUser } from './helpers/fixtures'
import { setupIntegrationSuite } from './helpers/suite'
import type { DrizzleService } from '@backend/database/drizzle.service'

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

  it('groups friends overview by user with per-grade counts', async () => {
    const active = await seedUser(db, 'rater-active')
    const quiet = await seedUser(db, 'rater-quiet')
    await seedUser(db, 'rater-silent')
    const [first, second] = await db
      .insert(records)
      .values([seedRecord({ title: 'One' }), seedRecord({ title: 'Two' })])
      .returning()
    if (!first || !second) throw new Error('seed record failed')
    await ratings.upsert(active.id, first.id, RecordGrade.LIKE)
    await ratings.upsert(active.id, second.id, RecordGrade.LIKE)
    await ratings.upsert(quiet.id, first.id, RecordGrade.DISLIKE)

    const overview = await ratings.getFriendsOverview()
    const byLogin = new Map(overview.map((member) => [member.login, member]))

    expect(byLogin.get('rater-active')).toMatchObject({
      userId: active.id,
      counts: { DISLIKE: 0, BEER: 0, LIKE: 2, RECOMMEND: 0 },
    })
    expect(byLogin.get('rater-quiet')?.counts[RecordGrade.DISLIKE]).toBe(1)
    expect(byLogin.has('rater-silent')).toBe(false)
  })
})
