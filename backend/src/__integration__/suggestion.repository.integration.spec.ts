import { afterAll, beforeEach, expect, it } from 'bun:test'
import { limits, records, suggestionOwnerships } from '@gmd/database/schema'
import { eq } from 'drizzle-orm'
import { DrizzleSuggestionRepository } from '@/modules/suggestion/repositories/drizzle-suggestion.repository'
import {
  createTestDb,
  createTestPool,
  integrationDescribe,
  integrationEnabled,
  truncateAll,
} from './helpers/db'
import { seedLike, seedRecord, seedUser } from './helpers/fixtures'
import type { DrizzleService } from '@/database/drizzle.service'

integrationDescribe('DrizzleSuggestionRepository (integration)', () => {
  if (!integrationEnabled) return
  const pool = createTestPool()
  const db = createTestDb(pool)
  const repository = new DrizzleSuggestionRepository({ db } as unknown as DrizzleService)

  beforeEach(async () => {
    await truncateAll(pool)
  })

  afterAll(async () => {
    await pool.end()
  })

  it('finds a configured limit or returns null', async () => {
    expect(await repository.findLimit('SUGGESTION')).toBeNull()

    await db.insert(limits).values({ name: 'SUGGESTION', quantity: 3 })

    expect((await repository.findLimit('SUGGESTION'))?.quantity).toBe(3)
  })

  it('counts only ownerships of the requested type', async () => {
    const user = await seedUser(db, 'suggester')
    const [suggestion] = await db
      .insert(records)
      .values(seedRecord({ type: 'SUGGESTION' }))
      .returning()
    const [written] = await db
      .insert(records)
      .values(seedRecord({ type: 'WRITTEN' }))
      .returning()
    if (!suggestion || !written) throw new Error('seed failed')
    await db.insert(suggestionOwnerships).values([
      { recordId: suggestion.id, userId: user.id },
      { recordId: written.id, userId: user.id },
    ])

    expect(await repository.countUserSuggestions(user.id, 'SUGGESTION')).toBe(1)
    expect(await repository.countUserSuggestions(user.id, 'WRITTEN')).toBe(1)
    expect(await repository.countUserSuggestions('other-user', 'SUGGESTION')).toBe(0)
  })

  it('creates a suggestion with ownership and loads it back with relations', async () => {
    const user = await seedUser(db, 'suggester')

    const created = await repository.createSuggestion(
      { title: 'Anime', posterUrl: '', genre: 'ANIME', link: 'https://shikimori.one/animes/1' },
      user.id,
    )

    expect(created.suggestionOwnership?.userId).toBe(user.id)
    const loaded = await repository.findSuggestions({ types: ['SUGGESTION'] })
    expect(loaded.map((record) => record.id)).toEqual([created.id])
  })

  it('filters suggestions by types and statuses', async () => {
    await db
      .insert(records)
      .values([
        seedRecord({ title: 'Suggestion Queue', type: 'SUGGESTION', status: 'QUEUE' }),
        seedRecord({ title: 'Suggestion Done', type: 'SUGGESTION', status: 'DONE' }),
        seedRecord({ title: 'Written Queue', type: 'WRITTEN', status: 'QUEUE' }),
        seedRecord({ title: 'Written Done', type: 'WRITTEN', status: 'DONE' }),
        seedRecord({ title: 'Order Queue', type: 'ORDER', status: 'QUEUE' }),
      ])

    const result = await repository.findSuggestions({
      types: ['SUGGESTION', 'WRITTEN'],
      statuses: ['QUEUE', 'PROGRESS'],
    })

    expect(result.map((record) => record.title).sort()).toEqual([
      'Suggestion Done',
      'Suggestion Queue',
      'Written Queue',
    ])
  })

  it('finds a suggestion by id and its owner, or returns null', async () => {
    const user = await seedUser(db, 'owner')
    const created = await repository.createSuggestion(
      { title: 'Anime', posterUrl: '', genre: 'ANIME', link: 'https://shikimori.one/animes/2' },
      user.id,
    )

    expect((await repository.findSuggestionById(created.id))?.title).toBe('Anime')
    expect(await repository.findSuggestionById(999999)).toBeNull()
    expect(await repository.findSuggestionOwner(created.id)).toEqual({ userId: user.id })
    expect(await repository.findSuggestionOwner(999999)).toBeNull()
  })

  it('deletes the suggestion with its likes and ownership', async () => {
    const user = await seedUser(db, 'owner')
    const liker = await seedUser(db, 'liker')
    const created = await repository.createSuggestion(
      { title: 'Anime', posterUrl: '', genre: 'ANIME', link: 'https://shikimori.one/animes/3' },
      user.id,
    )
    await seedLike(db, liker.id, created.id)

    await repository.deleteSuggestionWithLikes(created.id)

    expect(await repository.findSuggestionById(created.id)).toBeNull()
    expect(await repository.findSuggestionOwner(created.id)).toBeNull()
    const recordRows = await db.select().from(records).where(eq(records.id, created.id))
    expect(recordRows).toHaveLength(0)
  })
})
