import { expect, it } from 'bun:test'
import crypto from 'node:crypto'
import {
  likes,
  records,
  suggestionOwnerships,
  userAccounts,
  users,
  wordleGames,
} from '@gmd/database/schema'
import { eq } from 'drizzle-orm'
import { UserRole } from '@/enums'
import { DrizzleUserRepository } from '@/modules/user/repositories/drizzle-user.repository'
import { seedLike, seedRecord, seedUser } from './helpers/fixtures'
import { setupIntegrationSuite } from './helpers/suite'
import type { DrizzleService } from '@/database/drizzle.service'
import type { CreateUserData } from '@/modules/user/entities/user-domain.entity'

function userData(overrides: Partial<CreateUserData> = {}): CreateUserData {
  return {
    login: 'user',
    role: UserRole.USER,
    profileImageUrl: '',
    color: '#333333',
    platform: 'TWITCH',
    platformUserId: crypto.randomUUID(),
    platformLogin: 'platform-user',
    ...overrides,
  }
}

setupIntegrationSuite('DrizzleUserRepository (integration)', ({ db }) => {
  const repository = new DrizzleUserRepository({ db } as unknown as DrizzleService)

  it('creates a user with its platform account and rejects a duplicate account', async () => {
    const platformUserId = crypto.randomUUID()

    const created = await repository.create(
      userData({ login: 'alice', platformUserId, platformLogin: 'alice-twitch' }),
    )

    expect(created.login).toBe('alice')
    const accounts = await repository.findAccountsByUserId(created.id)
    expect(accounts).toHaveLength(1)
    expect(accounts[0]?.platform).toBe('TWITCH')
    expect(accounts[0]?.platformLogin).toBe('alice-twitch')

    await expect(
      repository.create(userData({ login: 'bob', platformUserId: platformUserId })),
    ).rejects.toThrow()
  })

  it('finds by platform id and by case-insensitive trimmed login', async () => {
    const platformUserId = crypto.randomUUID()
    const created = await repository.create(userData({ login: 'Alice', platformUserId }))

    expect((await repository.findByPlatformId('TWITCH', platformUserId))?.id).toBe(created.id)
    expect(await repository.findByPlatformId('KICK', platformUserId)).toBeNull()
    expect((await repository.findByLogin('  alice  '))?.id).toBe(created.id)
    expect(await repository.findByLogin('unknown')).toBeNull()
  })

  it('updates fields and throws when the user is missing', async () => {
    const created = await repository.create(userData({ login: 'before' }))

    const updated = await repository.update(created.id, {
      login: 'after',
      role: UserRole.ADMIN,
    })

    expect(updated.login).toBe('after')
    expect(updated.role).toBe(UserRole.ADMIN)
    await expect(repository.update('missing-id', { login: 'x' })).rejects.toThrow('not found')
  })

  it('deletes the user with likes and suggestion ownerships', async () => {
    const user = await seedUser(db, 'victim')
    const [record] = await db.insert(records).values(seedRecord()).returning()
    if (!record) throw new Error('seed failed')
    await seedLike(db, user.id, record.id)
    await db.insert(suggestionOwnerships).values({ recordId: record.id, userId: user.id })

    await repository.deleteWithCascade(user.id)

    expect(await repository.findById(user.id)).toBeNull()
    expect(await db.select().from(likes).where(eq(likes.userId, user.id))).toHaveLength(0)
    expect(
      await db.select().from(suggestionOwnerships).where(eq(suggestionOwnerships.userId, user.id)),
    ).toHaveLength(0)
  })

  it('links and unlinks platform accounts', async () => {
    const user = await seedUser(db, 'linker')

    await repository.linkPlatformAccount(user.id, {
      platform: 'KICK',
      platformUserId: 'kick-1',
      platformLogin: 'kicker',
    })
    expect((await repository.findAccountsByUserId(user.id)).map((a) => a.platform)).toContain(
      'KICK',
    )

    await repository.unlinkPlatformAccount(user.id, 'KICK')
    expect((await repository.findAccountsByUserId(user.id)).map((a) => a.platform)).not.toContain(
      'KICK',
    )
  })

  it('merges users: moves non-conflicting rows, drops duplicates and elevates admin', async () => {
    const target = await seedUser(db, 'target')
    const source = await seedUser(db, 'source', UserRole.ADMIN)
    const [recordA] = await db
      .insert(records)
      .values(seedRecord({ title: 'A' }))
      .returning()
    const [recordB] = await db
      .insert(records)
      .values(seedRecord({ title: 'B' }))
      .returning()
    const [recordC] = await db
      .insert(records)
      .values(seedRecord({ title: 'C' }))
      .returning()
    if (!recordA || !recordB || !recordC) throw new Error('seed failed')

    await seedLike(db, target.id, recordA.id)
    await seedLike(db, source.id, recordA.id)
    await seedLike(db, source.id, recordB.id)
    await db.insert(suggestionOwnerships).values({ recordId: recordC.id, userId: source.id })
    await db.insert(userAccounts).values([
      {
        userId: target.id,
        platform: 'TWITCH',
        platformUserId: 'tw-1',
        platformLogin: 'tw-target',
      },
      {
        userId: source.id,
        platform: 'TWITCH',
        platformUserId: 'tw-2',
        platformLogin: 'tw-source',
      },
      {
        userId: source.id,
        platform: 'KICK',
        platformUserId: 'kick-1',
        platformLogin: 'kick-source',
      },
    ])
    await db.insert(wordleGames).values([
      { id: crypto.randomUUID(), userId: target.id, date: '2026-09-01', answer: 'а' },
      { id: crypto.randomUUID(), userId: source.id, date: '2026-09-01', answer: 'б' },
      { id: crypto.randomUUID(), userId: source.id, date: '2026-09-02', answer: 'в' },
    ])

    const result = await repository.mergeUsers(target.id, source.id)

    expect(result).toEqual({
      accountsMoved: 1,
      accountsDropped: 1,
      likesMoved: 1,
      likesDropped: 1,
      suggestionsMoved: 1,
      wordleGamesMoved: 1,
      wordleGamesDropped: 1,
    })
    expect(await repository.findById(source.id)).toBeNull()
    expect((await repository.findById(target.id))?.role).toBe(UserRole.ADMIN)
    expect(
      (await repository.findAccountsByUserId(target.id)).map((a) => a.platform).sort(),
    ).toEqual(['KICK', 'TWITCH'])
    expect(await db.select().from(likes).where(eq(likes.userId, source.id))).toHaveLength(0)
    expect(
      (
        await db
          .select()
          .from(suggestionOwnerships)
          .where(eq(suggestionOwnerships.recordId, recordC.id))
      )[0]?.userId,
    ).toBe(target.id)
    expect(
      await db.select().from(wordleGames).where(eq(wordleGames.userId, target.id)),
    ).toHaveLength(2)
  })

  it('rolls back the whole merge when a late step fails inside the transaction', async () => {
    const target = await seedUser(db, 'target')
    const source = await seedUser(db, 'source')
    const [record] = await db.insert(records).values(seedRecord()).returning()
    if (!record) throw new Error('seed failed')
    await seedLike(db, target.id, record.id)
    await seedLike(db, source.id, record.id)
    await db.insert(userAccounts).values([
      { userId: target.id, platform: 'TWITCH', platformUserId: 'tw-1', platformLogin: 't' },
      { userId: source.id, platform: 'KICK', platformUserId: 'k-1', platformLogin: 's' },
    ])
    await db.insert(wordleGames).values([
      { id: crypto.randomUUID(), userId: target.id, date: '2026-09-29', answer: 'а' },
      { id: crypto.randomUUID(), userId: source.id, date: '2026-09-29', answer: 'б' },
    ])

    const failingDb = {
      transaction: (callback: (tx: unknown) => Promise<unknown>) =>
        db.transaction((tx) =>
          callback(
            new Proxy(tx, {
              get(object, property, receiver) {
                if (property === 'delete') {
                  return (table: unknown) => {
                    if (table === wordleGames) throw new Error('boom')
                    return object.delete(table as never)
                  }
                }
                return Reflect.get(object, property, receiver)
              },
            }),
          ),
        ),
    }
    const failingRepository = new DrizzleUserRepository({
      db: failingDb,
    } as unknown as DrizzleService)

    await expect(failingRepository.mergeUsers(target.id, source.id)).rejects.toThrow('boom')

    expect(await db.select().from(userAccounts)).toHaveLength(2)
    expect(await db.select().from(likes)).toHaveLength(2)
    expect(await db.select().from(wordleGames)).toHaveLength(2)
    expect((await db.select().from(users)).map((user) => user.id).sort()).toEqual(
      [source.id, target.id].sort(),
    )
  })
})
