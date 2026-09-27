import { describe, expect, it, mock } from 'bun:test'
import { wordleNotificationSubscriptions } from '@gmd/database/schema'
import { DrizzleWordleNotificationRepository } from '@/modules/wordle/repositories/drizzle-wordle-notification.repository'

const ROW = {
  id: 1,
  userId: 'user-1',
  chatId: '42',
  telegramUsername: 'ivan',
  morningEnabled: false,
  eveningEnabled: true,
  createdAt: new Date('2026-09-20T09:00:00Z'),
}

function createTxMock(options: { updatedRows?: unknown[]; insertedRows?: unknown[] }) {
  const deletes: unknown[] = []
  const updates: Array<{ values: unknown }> = []
  const inserts: unknown[] = []
  const tx = {
    delete: mock((table: unknown) => {
      deletes.push(table)
      return { where: mock(() => Promise.resolve(undefined)) }
    }),
    update: mock(() => ({
      set: mock((values: unknown) => {
        updates.push({ values })
        return {
          where: mock(() => ({
            returning: mock(() => Promise.resolve(options.updatedRows ?? [])),
          })),
        }
      }),
    })),
    insert: mock(() => ({
      values: mock((values: unknown) => {
        inserts.push(values)
        return { returning: mock(() => Promise.resolve(options.insertedRows ?? [])) }
      }),
    })),
  }
  return { tx, deletes, updates, inserts }
}

function createRepository(options: { updatedRows?: unknown[]; insertedRows?: unknown[] } = {}) {
  const { tx, deletes, updates, inserts } = createTxMock(options)
  const db = {
    transaction: mock((callback: (tx: unknown) => unknown) => callback(tx)),
  }
  const repository = new DrizzleWordleNotificationRepository({ db } as never)
  return { repository, deletes, updates, inserts }
}

describe('DrizzleWordleNotificationRepository', () => {
  it('updates an existing subscription keeping its flags', async () => {
    const { repository, deletes, updates, inserts } = createRepository({ updatedRows: [ROW] })

    const result = await repository.upsert({
      userId: 'user-1',
      chatId: '42',
      telegramUsername: 'ivan',
    })

    expect(result).toEqual(ROW)
    expect(deletes).toContainEqual(wordleNotificationSubscriptions)
    expect(updates[0]?.values).toEqual({ chatId: '42', telegramUsername: 'ivan' })
    expect(inserts.length).toBe(0)
  })

  it('inserts a subscription when the user has none', async () => {
    const { repository, inserts } = createRepository({ insertedRows: [ROW] })

    const result = await repository.upsert({
      userId: 'user-1',
      chatId: '42',
      telegramUsername: null,
    })

    expect(result).toEqual(ROW)
    expect(inserts[0]).toEqual({ userId: 'user-1', chatId: '42', telegramUsername: null })
  })

  it('returns null when updating flags of a missing subscription', async () => {
    const db = {
      update: mock(() => ({
        set: mock(() => ({
          where: mock(() => ({ returning: mock(() => Promise.resolve([])) })),
        })),
      })),
    }
    const repository = new DrizzleWordleNotificationRepository({ db } as never)

    expect(await repository.updateFlags('user-1', { morningEnabled: true })).toBeNull()
  })

  it('collects yesterday winners as user ids', async () => {
    const where = mock(() => Promise.resolve([{ userId: 'user-1' }, { userId: 'user-2' }]))
    const db = {
      selectDistinct: mock(() => ({ from: mock(() => ({ where })) })),
    }
    const repository = new DrizzleWordleNotificationRepository({ db } as never)

    expect(await repository.findUserIdsWonOnDate('2026-09-19')).toEqual(['user-1', 'user-2'])
  })

  it('deletes a conflicting chat before rebinding and updating', async () => {
    const order: string[] = []
    const deleteWhere = mock(() => Promise.resolve(undefined))
    const tx = {
      delete: mock(() => {
        order.push('delete')
        return { where: deleteWhere }
      }),
      update: mock(() => ({
        set: mock(() => {
          order.push('update')
          return {
            where: mock(() => ({ returning: mock(() => Promise.resolve([ROW])) })),
          }
        }),
      })),
      insert: mock(() => {
        order.push('insert')
        return { values: mock(() => ({ returning: mock(() => Promise.resolve([ROW])) })) }
      }),
    }
    const db = {
      transaction: mock((callback: (tx: unknown) => unknown) => callback(tx)),
    }
    const repository = new DrizzleWordleNotificationRepository({ db } as never)

    await repository.upsert({ userId: 'user-2', chatId: '42', telegramUsername: null })

    expect(order).toEqual(['delete', 'update'])
    expect(deleteWhere).toHaveBeenCalledTimes(1)
  })
})
