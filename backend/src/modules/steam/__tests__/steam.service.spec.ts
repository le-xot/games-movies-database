import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { createMock } from '@/__tests__/helpers/mock-factory'
import { RecordGenre, RecordStatus, RecordType } from '@/enums'
import { RecordRepository } from '@/modules/record/repositories/record.repository'
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
  let mockRecordRepo: RecordRepository
  let mockRecordsProviders: { fetchIGDBFromSteam: ReturnType<typeof mock> }
  let mockEventEmitter: { emit: ReturnType<typeof mock> }

  beforeEach(() => {
    mockRecordRepo = createMock(RecordRepository)
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
    service = new SteamService(
      mockRecordsProviders as any,
      mockRecordRepo,
      mockEventEmitter as any,
    )
  })

  describe('getExistingAppIds', () => {
    it('returns set of steam app IDs from records', async () => {
      mockRecordRepo.findManyByExtraField = mock(() =>
        Promise.resolve([
          makeRecord({ extra: { steamAppId: '111' } }),
          makeRecord({ extra: { steamAppId: '222' } }),
        ]),
      )

      const result = await service.getExistingAppIds()

      expect(result.size).toBe(2)
      expect(result.has('111')).toBe(true)
      expect(result.has('222')).toBe(true)
    })

    it('returns empty set when no records have steamAppId', async () => {
      mockRecordRepo.findManyByExtraField = mock(() => Promise.resolve([]))

      const result = await service.getExistingAppIds()

      expect(result.size).toBe(0)
    })
  })

  describe('importGames', () => {
    it('skips games that already exist', async () => {
      mockRecordRepo.findManyByExtraField = mock(() =>
        Promise.resolve([makeRecord({ extra: { steamAppId: '111' } })]),
      )

      const result = await service.importGames([{ appId: 111, status: RecordStatus.DONE }])

      expect(result.created).toHaveLength(0)
      expect(result.failed).toHaveLength(1)
      expect(result.failed[0].reason).toContain('Already exists')
    })

    it('creates record with IGDB data and emits event', async () => {
      mockRecordRepo.findManyByExtraField = mock(() => Promise.resolve([]))
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
      mockRecordRepo.findManyByExtraField = mock(() => Promise.resolve([]))
      mockRecordsProviders.fetchIGDBFromSteam = mock(() =>
        Promise.reject(new Error('IGDB fail')),
      )

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
      mockRecordRepo.findManyByExtraField = mock(() => Promise.resolve([]))
      const created = makeRecord({ id: 60 })
      mockRecordRepo.create = mock(() => Promise.resolve(created))
      mockRecordRepo.update = mock(() => Promise.resolve(created))

      await service.importGames([{ appId: 777, status: RecordStatus.DONE, grade: 'LIKE' as any }])

      expect(mockRecordRepo.update).toHaveBeenCalledWith(60, { grade: 'LIKE' })
    })
  })
})
