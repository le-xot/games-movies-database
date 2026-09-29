import { expect, it } from 'bun:test'
import { limits, records } from '@gmd/database/schema'
import { DrizzleLikeRepository } from '@/modules/like/repositories/drizzle-like.repository'
import { DrizzleLimitRepository } from '@/modules/limit/repositories/drizzle-limit.repository'
import { seedRecord, seedUser } from './helpers/fixtures'
import { setupIntegrationSuite } from './helpers/suite'
import type { DrizzleService } from '@/database/drizzle.service'

setupIntegrationSuite('DrizzleLikeRepository / DrizzleLimitRepository (integration)', ({ db }) => {
  const likeRepository = new DrizzleLikeRepository({ db } as unknown as DrizzleService)
  const limitRepository = new DrizzleLimitRepository({ db } as unknown as DrizzleService)

  it('creates a like and rejects a duplicate for the same user and record', async () => {
    const user = await seedUser(db, 'liker')
    const [record] = await db.insert(records).values(seedRecord()).returning()
    if (!record) throw new Error('seed failed')

    const created = await likeRepository.create(user.id, record.id)

    expect(created.userId).toBe(user.id)
    expect(created.recordId).toBe(record.id)
    expect((await likeRepository.findByUserAndRecord(user.id, record.id))?.id).toBe(created.id)
    await expect(likeRepository.create(user.id, record.id)).rejects.toThrow()
  })

  it('deletes a like and reports the affected count', async () => {
    const user = await seedUser(db, 'liker')
    const [record] = await db.insert(records).values(seedRecord()).returning()
    if (!record) throw new Error('seed failed')
    await likeRepository.create(user.id, record.id)

    expect(await likeRepository.deleteByUserAndRecord(user.id, record.id)).toBe(1)
    expect(await likeRepository.deleteByUserAndRecord(user.id, record.id)).toBe(0)
    expect(await likeRepository.findByUserAndRecord(user.id, record.id)).toBeNull()
  })

  it('lists likes by record and by user with pagination and totals', async () => {
    const first = await seedUser(db, 'first')
    const second = await seedUser(db, 'second')
    const [recordA] = await db
      .insert(records)
      .values(seedRecord({ title: 'A' }))
      .returning()
    const [recordB] = await db
      .insert(records)
      .values(seedRecord({ title: 'B' }))
      .returning()
    if (!recordA || !recordB) throw new Error('seed failed')
    await likeRepository.create(first.id, recordA.id)
    await likeRepository.create(second.id, recordA.id)
    await likeRepository.create(first.id, recordB.id)

    expect(await likeRepository.countAll()).toBe(3)
    expect(await likeRepository.findByRecord(recordA.id)).toHaveLength(2)
    expect(await likeRepository.findByUser(first.id)).toHaveLength(2)
    expect(await likeRepository.findMany(1, 1)).toHaveLength(1)
  })

  it('updates a limit and returns the updated row', async () => {
    await db.insert(limits).values({ name: 'SUGGESTION', quantity: 5 })

    const updated = await limitRepository.update('SUGGESTION', 10)

    expect(updated.quantity).toBe(10)
  })

  it('throws when the limit row is missing', async () => {
    await expect(limitRepository.update('SUGGESTION', 1)).rejects.toThrow('not found')
  })
})
