import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { createMock } from '@/__tests__/helpers/mock-factory'
import { RecordGenre, RecordStatus, RecordType } from '@/enums'
import { DrizzleRecordRepository } from '@/modules/record/repositories/drizzle-record.repository'
import { SteamService } from '../steam.service'

const makeRecord = (overrides?: Record<string, unknown>) => ({
  id: 1,
  title: 'Test Game',
  link: 'https://igdb.com/games/test',
  posterUrl: 'https://img.example.com/cover.jpg',
  status: RecordStatus.DONE,
  type: RecordType.WRITTEN,
  genre: RecordGenre.GAME,
  extra: { steamAppId: '1234' },
  createdAt: new Date(),
  ...overrides,
})

describe('SteamService', () => {
  let service: SteamService
  let mockRecordRepo: DrizzleRecordRepository
  let mockRecordsProviders: { fetchIGDBFromSteam: ReturnType<typeof mock> }
  let mockEventEmitter: { emit: ReturnType<typeof mock> }

  beforeEach(() => {
    mockRecordRepo = createMock(DrizzleRecordRepository)
    mockRecordsProviders = {
      fetchIGDBFromSteam: mock(() =>
        Promise.resolve({
          title: 'IGDB Game',
          posterUrl: 'https://igdb.com/cover.jpg',
          genre: RecordGenre.GAME,
          link: 'https://igdb.com/games/test',
        }),
      ),
    }
    mockEventEmitter = { emit: mock(() => {}) }
    service = new SteamService(mockRecordsProviders as any, mockRecordRepo, mockEventEmitter as any)
  })

  describe('importGames', () => {
    it('skips games that already exist', async () => {
      mockRecordRepo.findAll = mock(() =>
        Promise.resolve([makeRecord({ extra: { steamAppId: '111' } })]),
      )

      const result = await service.importGames([{ appId: 111, status: RecordStatus.DONE }])

      expect(result.created).toHaveLength(0)
      expect(result.failed).toHaveLength(1)
      expect(result.failed[0].reason).toContain('Already exists')
    })

    it('creates record with IGDB data and emits event', async () => {
      mockRecordRepo.findAll = mock(() => Promise.resolve([]))
      const created = makeRecord({ id: 42 })
      mockRecordRepo.create = mock(() => Promise.resolve(created))

      const result = await service.importGames([{ appId: 999, status: RecordStatus.DONE }])

      expect(result.created).toHaveLength(1)
      expect(mockRecordRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'IGDB Game',
          genre: RecordGenre.GAME,
          type: RecordType.WRITTEN,
          status: RecordStatus.DONE,
          extra: { steamAppId: '999' },
        }),
      )
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'update-records',
        expect.objectContaining({ id: 42, action: 'created' }),
      )
    })

    it('falls back to Steam data when IGDB fails', async () => {
      mockRecordRepo.findAll = mock(() => Promise.resolve([]))
      mockRecordsProviders.fetchIGDBFromSteam = mock(() => Promise.reject(new Error('IGDB fail')))

      const originalFetch = globalThis.fetch
      globalThis.fetch = mock(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              '888': {
                success: true,
                data: { name: 'Steam Game', header_image: 'https://steam.com/img' },
              },
            }),
        }),
      ) as any

      const created = makeRecord({ id: 50, title: 'Steam Game' })
      mockRecordRepo.create = mock(() => Promise.resolve(created))

      const result = await service.importGames([{ appId: 888, status: RecordStatus.DONE }])

      expect(result.created).toHaveLength(1)
      expect(mockRecordRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Steam Game',
          posterUrl: 'https://steam.com/img',
          link: 'https://store.steampowered.com/app/888',
        }),
      )

      globalThis.fetch = originalFetch
    })

    it('sets grade when provided', async () => {
      mockRecordRepo.findAll = mock(() => Promise.resolve([]))
      const created = makeRecord({ id: 60 })
      mockRecordRepo.create = mock(() => Promise.resolve(created))
      mockRecordRepo.update = mock(() => Promise.resolve(created))

      await service.importGames([{ appId: 777, status: RecordStatus.DONE, grade: 'LIKE' as any }])

      expect(mockRecordRepo.update).toHaveBeenCalledWith(60, { grade: 'LIKE' })
    })

    it('skips games whose title matches an existing record', async () => {
      mockRecordRepo.findAll = mock(() =>
        Promise.resolve([makeRecord({ id: 2, title: 'IGDB Game', extra: null })]),
      )

      const result = await service.importGames([{ appId: 123, status: RecordStatus.DONE }])

      expect(result.created).toHaveLength(0)
      expect(result.failed).toHaveLength(1)
      expect(result.failed[0].reason).toContain('Already exists')
      expect(mockRecordRepo.create).not.toHaveBeenCalled()
    })

    it('skips repeated appIds within a single import batch', async () => {
      mockRecordRepo.findAll = mock(() => Promise.resolve([]))
      const created = makeRecord({ id: 70 })
      mockRecordRepo.create = mock(() => Promise.resolve(created))

      const result = await service.importGames([
        { appId: 321, status: RecordStatus.DONE },
        { appId: 321, status: RecordStatus.DONE },
      ])

      expect(result.created).toHaveLength(1)
      expect(result.failed).toHaveLength(1)
      expect(mockRecordRepo.create).toHaveBeenCalledTimes(1)
    })
  })
})
