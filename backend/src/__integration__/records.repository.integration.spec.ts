import { expect, it } from 'bun:test'
import { likes, records, suggestionOwnerships } from '@gmd/database/schema'
import { eq } from 'drizzle-orm'
import { DrizzleRecordRepository } from '@/modules/record/repositories/drizzle-record.repository'
import { seedLike, seedRecord, recordCreateData, seedUser } from './helpers/fixtures'
import { setupIntegrationSuite } from './helpers/suite'
import type { DrizzleService } from '@/database/drizzle.service'

setupIntegrationSuite('DrizzleRecordRepository (integration)', ({ db }) => {
  const repository = new DrizzleRecordRepository({ db } as unknown as DrizzleService)

  it('applies database defaults on create and keeps nullable columns null', async () => {
    const created = await repository.create(recordCreateData({ title: 'Alpha' }))

    expect(created.title).toBe('Alpha')
    expect(created.status).toBe('QUEUE')
    expect(created.type).toBe('WRITTEN')
    expect(created.genre).toBeNull()
    expect(created.grade).toBeNull()
    expect(created.episode).toBeNull()
    expect(created.extra).toBeNull()
    expect(created.createdAt).toBeInstanceOf(Date)
  })

  it('passes explicit create fields through to the database', async () => {
    const created = await repository.create(
      recordCreateData({
        title: 'Explicit',
        genre: 'ANIME',
        status: 'PROGRESS',
        type: 'SUGGESTION',
        extra: { source: 'test' },
      }),
    )

    expect(created.genre).toBe('ANIME')
    expect(created.status).toBe('PROGRESS')
    expect(created.type).toBe('SUGGESTION')
    expect(created.extra).toEqual({ source: 'test' })
  })

  it('creates a suggestion ownership row when userId is passed', async () => {
    const user = await seedUser(db, 'owner')

    const created = await repository.create(recordCreateData({ userId: user.id }))

    const ownership = await db
      .select()
      .from(suggestionOwnerships)
      .where(eq(suggestionOwnerships.recordId, created.id))
    expect(ownership).toHaveLength(1)
    expect(ownership[0]?.userId).toBe(user.id)
  })

  it('loads likes relation and returns null for a missing record', async () => {
    const user = await seedUser(db, 'liker')
    const created = await repository.create(recordCreateData({ title: 'With like' }))
    await seedLike(db, user.id, created.id)

    const found = await repository.findById(created.id)

    expect(found?.likes).toHaveLength(1)
    expect(found?.likes?.[0]?.userId).toBe(user.id)
    expect(await repository.findById(999999)).toBeNull()
  })

  it('clears grade with an explicit null update and updates plain fields', async () => {
    const created = await repository.create(recordCreateData())
    await repository.update(created.id, { grade: 'LIKE' })

    const updated = await repository.update(created.id, { title: 'Renamed', grade: null })

    expect(updated.title).toBe('Renamed')
    expect(updated.grade).toBeNull()
    const unchanged = await repository.update(created.id, {})
    expect(unchanged.id).toBe(created.id)
    expect(unchanged.grade).toBeNull()
  })

  it('throws when updating a missing record', async () => {
    await expect(repository.update(999999, { title: 'x' })).rejects.toThrow('not found')
  })

  it('deletes the record together with its likes', async () => {
    const user = await seedUser(db, 'liker')
    const created = await repository.create(recordCreateData())
    await seedLike(db, user.id, created.id)

    await repository.delete(created.id)

    expect(await repository.findById(created.id)).toBeNull()
    const remaining = await db.select().from(likes).where(eq(likes.recordId, created.id))
    expect(remaining).toHaveLength(0)
  })

  it('filters by search/status/type/genre/grade and counts matches', async () => {
    await db.insert(records).values([
      seedRecord({ title: 'Alpha Game', genre: 'GAME', status: 'DONE', grade: 'LIKE' }),
      seedRecord({ title: 'Beta Movie', genre: 'MOVIE', status: 'QUEUE' }),
      seedRecord({
        title: 'Gamma Anime',
        genre: 'ANIME',
        status: 'PROGRESS',
        type: 'SUGGESTION',
      }),
    ])

    expect(await repository.count({})).toBe(3)
    expect((await repository.findAll({ search: 'beta' }, {}, { skip: 0, take: 50 })).length).toBe(1)
    expect(
      (await repository.findAll({ status: ['DONE', 'PROGRESS'] }, {}, { skip: 0, take: 50 }))
        .length,
    ).toBe(2)
    expect(
      (await repository.findAll({ type: 'SUGGESTION' }, {}, { skip: 0, take: 50 })).length,
    ).toBe(1)
    expect((await repository.findAll({ genre: 'MOVIE' }, {}, { skip: 0, take: 50 })).length).toBe(1)
    expect((await repository.findAll({ grade: ['LIKE'] }, {}, { skip: 0, take: 50 })).length).toBe(
      1,
    )
    expect(await repository.count({ type: 'SUGGESTION' })).toBe(1)
  })

  it('sorts and paginates results', async () => {
    await repository.create(recordCreateData({ title: 'Alpha Game' }))
    await repository.create(recordCreateData({ title: 'Beta Movie' }))
    await repository.create(recordCreateData({ title: 'Gamma Anime' }))

    const byTitle = await repository.findAll(
      {},
      { orderBy: 'title', direction: 'asc' },
      { skip: 0, take: 50 },
    )
    expect(byTitle.map((record) => record.title)).toEqual([
      'Alpha Game',
      'Beta Movie',
      'Gamma Anime',
    ])

    const page = await repository.findAll(
      {},
      { orderBy: 'id', direction: 'asc' },
      { skip: 1, take: 1 },
    )
    expect(page).toHaveLength(1)
    expect(page[0]?.title).toBe('Beta Movie')

    const descending = await repository.findAll(
      {},
      { orderBy: 'title', direction: 'desc' },
      { skip: 0, take: 50 },
    )
    expect(descending.map((record) => record.title)).toEqual([
      'Gamma Anime',
      'Beta Movie',
      'Alpha Game',
    ])
  })
})
