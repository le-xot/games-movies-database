import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { suggestionOwnerships } from '@gmd/database/schema'
import { RecordGenre, RecordStatus, RecordType } from '@/enums'
import { DrizzleRecordRepository } from '../repositories/drizzle-record.repository'

interface InsertCall {
  table: unknown
  values: unknown
}

const makeRecord = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  title: 'Steam Game',
  link: 'https://store.steampowered.com/app/555',
  posterUrl: 'https://img.example.com/cover.jpg',
  status: RecordStatus.DONE,
  type: RecordType.WRITTEN,
  genre: RecordGenre.GAME,
  extra: { steamAppId: '555' },
  createdAt: new Date(),
  ...overrides,
})

const baseData = {
  title: 'Steam Game',
  link: 'https://store.steampowered.com/app/555',
  posterUrl: 'https://img.example.com/cover.jpg',
  genre: RecordGenre.GAME,
  status: RecordStatus.DONE,
  type: RecordType.WRITTEN,
  extra: { steamAppId: '555' },
}

describe('DrizzleRecordRepository', () => {
  let repository: DrizzleRecordRepository
  let insertCalls: InsertCall[]
  let txInsert: ReturnType<typeof mock>
  let dbInsert: ReturnType<typeof mock>

  const created = makeRecord()

  function createInsertMock() {
    return mock((table: unknown) => ({
      values: mock((values: unknown) => {
        insertCalls.push({ table, values })
        return Object.assign(Promise.resolve(undefined), {
          returning: mock(() => Promise.resolve([created])),
        })
      }),
    }))
  }

  beforeEach(() => {
    insertCalls = []
    txInsert = createInsertMock()
    dbInsert = createInsertMock()

    const db = {
      insert: dbInsert,
      transaction: mock((callback: (tx: unknown) => unknown) => callback({ insert: txInsert })),
    }

    repository = new DrizzleRecordRepository({ db } as any)
  })

  describe('create', () => {
    it('inserts a suggestion ownership row when userId is provided', async () => {
      await repository.create({ ...baseData, userId: 'user-1' })

      expect(txInsert).toHaveBeenCalledWith(suggestionOwnerships)
      expect(insertCalls).toContainEqual({
        table: suggestionOwnerships,
        values: { recordId: 1, userId: 'user-1' },
      })
    })

    it('does not insert an ownership row when userId is absent', async () => {
      await repository.create({ ...baseData })

      expect(insertCalls.some((call) => call.table === suggestionOwnerships)).toBe(false)
    })
  })
})
