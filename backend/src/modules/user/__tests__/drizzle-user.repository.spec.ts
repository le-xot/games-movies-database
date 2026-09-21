import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { likes, suggestionOwnerships, userAccounts, users, wordleGames } from '@gmd/database/schema'
import { UserRole } from '@/enums'
import { DrizzleUserRepository } from '../repositories/drizzle-user.repository'

interface UpdateCall {
  table: unknown
  values: unknown
}

interface DeleteCall {
  table: unknown
}

function createTxMock(
  selectResponses: Map<unknown, unknown[][]>,
  returningResponses = new Map<unknown, unknown[]>(),
) {
  const selectQueues = new Map([...selectResponses].map(([table, rows]) => [table, [...rows]]))
  const updates: UpdateCall[] = []
  const deletes: DeleteCall[] = []

  const tx = {
    select: mock(() => ({
      from: mock((table: unknown) => ({
        where: mock(() => Promise.resolve(selectQueues.get(table)?.shift() ?? [])),
      })),
    })),
    update: mock((table: unknown) => ({
      set: mock((values: unknown) => {
        updates.push({ table, values })
        return {
          where: mock(() =>
            Object.assign(Promise.resolve(undefined), {
              returning: mock(() => Promise.resolve(returningResponses.get(table) ?? [])),
            }),
          ),
        }
      }),
    })),
    delete: mock((table: unknown) => {
      deletes.push({ table })
      return {
        where: mock(() => Promise.resolve(undefined)),
      }
    }),
  }

  return { tx, updates, deletes }
}

function createRepository(
  selectResponses: Map<unknown, unknown[][]>,
  returningResponses?: Map<unknown, unknown[]>,
) {
  const { tx, updates, deletes } = createTxMock(selectResponses, returningResponses)
  const db = {
    transaction: mock((callback: (tx: unknown) => unknown) => callback(tx)),
  }

  return { repository: new DrizzleUserRepository({ db } as any), updates, deletes }
}

describe('DrizzleUserRepository', () => {
  describe('mergeUsers', () => {
    let selectResponses: Map<unknown, unknown[][]>
    let returningResponses: Map<unknown, unknown[]>

    beforeEach(() => {
      selectResponses = new Map()
      returningResponses = new Map()
    })

    it('moves non-conflicting data, drops duplicates and keeps the admin role', async () => {
      selectResponses.set(users, [
        [
          { id: 'target', role: UserRole.USER },
          { id: 'source', role: UserRole.ADMIN },
        ],
      ])
      selectResponses.set(userAccounts, [
        [{ platform: 'TWITCH' }],
        [
          { id: 1, platform: 'TWITCH' },
          { id: 2, platform: 'TELEGRAM' },
        ],
      ])
      selectResponses.set(likes, [
        [{ recordId: 10 }],
        [
          { id: 'like-a', recordId: 10 },
          { id: 'like-b', recordId: 11 },
        ],
      ])
      returningResponses.set(suggestionOwnerships, [{ id: 7 }])
      selectResponses.set(wordleGames, [
        [{ date: '2026-09-01' }],
        [
          { id: 'game-a', date: '2026-09-01' },
          { id: 'game-b', date: '2026-09-02' },
        ],
      ])

      const { repository, updates, deletes } = createRepository(selectResponses, returningResponses)

      const result = await repository.mergeUsers('target', 'source')

      expect(result).toEqual({
        accountsMoved: 1,
        accountsDropped: 1,
        likesMoved: 1,
        likesDropped: 1,
        suggestionsMoved: 1,
        wordleGamesMoved: 1,
        wordleGamesDropped: 1,
      })
      expect(updates).toContainEqual({ table: userAccounts, values: { userId: 'target' } })
      expect(updates).toContainEqual({ table: likes, values: { userId: 'target' } })
      expect(updates).toContainEqual({
        table: suggestionOwnerships,
        values: { userId: 'target' },
      })
      expect(updates).toContainEqual({ table: wordleGames, values: { userId: 'target' } })
      expect(updates).toContainEqual({ table: users, values: { role: UserRole.ADMIN } })
      expect(deletes.filter((call) => call.table === userAccounts)).toHaveLength(1)
      expect(deletes.filter((call) => call.table === likes)).toHaveLength(1)
      expect(deletes.filter((call) => call.table === wordleGames)).toHaveLength(1)
      expect(deletes.filter((call) => call.table === users)).toHaveLength(1)
    })

    it('moves everything and skips role change when there are no conflicts', async () => {
      selectResponses.set(users, [
        [
          { id: 'target', role: UserRole.USER },
          { id: 'source', role: UserRole.USER },
        ],
      ])
      selectResponses.set(userAccounts, [
        [{ platform: 'TWITCH' }],
        [{ id: 5, platform: 'TELEGRAM' }],
      ])
      selectResponses.set(likes, [[{ recordId: 1 }], [{ id: 'like-1', recordId: 2 }]])
      returningResponses.set(suggestionOwnerships, [{ id: 9 }])
      selectResponses.set(wordleGames, [
        [{ date: '2026-01-01' }],
        [{ id: 'game-1', date: '2026-01-02' }],
      ])

      const { repository, updates, deletes } = createRepository(selectResponses, returningResponses)

      const result = await repository.mergeUsers('target', 'source')

      expect(result).toEqual({
        accountsMoved: 1,
        accountsDropped: 0,
        likesMoved: 1,
        likesDropped: 0,
        suggestionsMoved: 1,
        wordleGamesMoved: 1,
        wordleGamesDropped: 0,
      })
      expect(updates).not.toContainEqual({ table: users, values: { role: UserRole.ADMIN } })
      expect(deletes.filter((call) => call.table === userAccounts)).toHaveLength(0)
      expect(deletes.filter((call) => call.table === likes)).toHaveLength(0)
      expect(deletes.filter((call) => call.table === wordleGames)).toHaveLength(0)
      expect(deletes.filter((call) => call.table === users)).toHaveLength(1)
    })
  })
})
