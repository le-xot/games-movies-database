import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { NotFoundException } from '@nestjs/common'
import { createMock } from '@/__tests__/helpers/mock-factory'
import { makeRecordRow } from '@/__tests__/helpers/record-fixture'
import { RecordGenre, RecordGrade, RecordStatus, RecordType } from '@/enums'
import { DrizzleRatingRepository } from '@/modules/rating/repositories/drizzle-rating.repository'
import { RecordService } from '../record.service'
import { DrizzleRecordRepository } from '../repositories/drizzle-record.repository'
import type { RecordWithRelations } from '@/modules/record/entities/record-domain.entity'

const makeRecord = (overrides?: Partial<RecordWithRelations>): RecordWithRelations =>
  makeRecordRow(overrides)

describe('RecordService', () => {
  let service: RecordService
  let mockRepo: DrizzleRecordRepository
  let mockRecordsProvider: { prepareData: ReturnType<typeof mock> }
  let mockEventEmitter: { emit: ReturnType<typeof mock> }
  let mockImgService: { getImageContent: ReturnType<typeof mock> }
  let mockRatingRepo: DrizzleRatingRepository

  beforeEach(() => {
    mockRepo = createMock(DrizzleRecordRepository)
    mockRecordsProvider = { prepareData: mock(() => {}) }
    mockEventEmitter = { emit: mock(() => {}) }
    mockImgService = {
      getImageContent: mock(() =>
        Promise.resolve({ buffer: Buffer.from([]), contentType: 'image/webp' }),
      ),
    }
    mockRatingRepo = createMock(DrizzleRatingRepository)
    mockRatingRepo.aggregateByRecords = mock(() => Promise.resolve(new Map()))
    mockRatingRepo.findMyGrades = mock(() => Promise.resolve(new Map()))
    service = new RecordService(
      mockRepo,
      mockRecordsProvider as any,
      mockEventEmitter as any,
      mockImgService as any,
      mockRatingRepo,
    )
  })

  describe('createRecordFromLink', () => {
    it('creates a record and emits update-queue event for QUEUE+WRITTEN', async () => {
      const preparedData = {
        title: 'New Record',
        posterUrl: 'http://img',
        genre: RecordGenre.ANIME,
      }
      const created = makeRecord({ id: 10, status: RecordStatus.QUEUE, type: RecordType.WRITTEN })

      mockRecordsProvider.prepareData = mock(() => Promise.resolve(preparedData))
      mockRepo.create = mock(() => Promise.resolve(created))

      const dto: any = { link: 'https://example.com/1' }

      await service.createRecordFromLink(dto)

      expect(mockRepo.create).toHaveBeenCalledTimes(1)
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'update-queue',
        expect.objectContaining({ id: 10, action: 'created' }),
      )
    })

    it('emits update-suggestions event for SUGGESTION type', async () => {
      const preparedData = {
        title: 'Suggestion',
        posterUrl: 'http://img',
        genre: RecordGenre.ANIME,
      }
      const created = makeRecord({
        id: 11,
        type: RecordType.SUGGESTION,
        status: RecordStatus.QUEUE,
      })

      mockRecordsProvider.prepareData = mock(() => Promise.resolve(preparedData))
      mockRepo.create = mock(() => Promise.resolve(created))

      await service.createRecordFromLink({ link: 'https://example.com' } as any)

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'update-suggestions',
        expect.objectContaining({ id: 11, action: 'created' }),
      )
    })

    it('persists the canonical link returned by the provider, not the raw input', async () => {
      const preparedData = {
        title: 'Canonical Movie',
        posterUrl: 'http://img',
        genre: RecordGenre.MOVIE,
        link: 'https://www.kinopoisk.ru/film/123',
      }
      const created = makeRecord({ id: 13, link: preparedData.link })

      mockRecordsProvider.prepareData = mock(() => Promise.resolve(preparedData))
      mockRepo.create = mock(() => Promise.resolve(created))

      await service.createRecordFromLink({ link: 'https://on.kinohub.vip/movie/123' } as any)

      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ link: 'https://www.kinopoisk.ru/film/123' }),
      )
    })

    it('emits update-records for the created record', async () => {
      const preparedData = {
        title: 'Fresh Movie',
        posterUrl: 'http://img',
        genre: RecordGenre.MOVIE,
      }
      const created = makeRecord({
        id: 12,
        genre: RecordGenre.MOVIE,
        status: RecordStatus.DONE,
        type: RecordType.WRITTEN,
      })

      mockRecordsProvider.prepareData = mock(() => Promise.resolve(preparedData))
      mockRepo.create = mock(() => Promise.resolve(created))

      await service.createRecordFromLink({ link: 'https://example.com/fresh' } as any)

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'update-records',
        expect.objectContaining({ id: 12, genre: RecordGenre.MOVIE, action: 'created' }),
      )
    })
  })

  describe('patchRecord', () => {
    it('throws NotFoundException when record does not exist', async () => {
      mockRepo.findById = mock(() => Promise.resolve(null))

      await expect(service.patchRecord(999, {} as any)).rejects.toThrow(NotFoundException)
      expect(mockRepo.update).not.toHaveBeenCalled()
    })

    it('updates record and always emits update-records', async () => {
      const existing = makeRecord({ id: 5, type: RecordType.WRITTEN, status: RecordStatus.QUEUE })
      const updated = makeRecord({ id: 5, type: RecordType.WRITTEN, status: RecordStatus.DONE })

      mockRepo.findById = mock(() => Promise.resolve(existing))
      mockRepo.update = mock(() => Promise.resolve(updated))

      const updateData = { status: RecordStatus.DONE }
      await service.patchRecord(5, updateData as any)

      expect(mockRepo.update).toHaveBeenCalledTimes(1)
      expect(mockRepo.update).toHaveBeenCalledWith(5, updateData)
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'update-records',
        expect.objectContaining({ id: 5, action: 'updated' }),
      )
    })

    it('emits update-suggestions when type changes away from SUGGESTION', async () => {
      const existing = makeRecord({ id: 5, type: RecordType.SUGGESTION })
      const updated = makeRecord({ id: 5, type: RecordType.WRITTEN })

      mockRepo.findById = mock(() => Promise.resolve(existing))
      mockRepo.update = mock(() => Promise.resolve(updated))

      const updateData = { type: RecordType.WRITTEN }
      await service.patchRecord(5, updateData as any)

      expect(mockRepo.update).toHaveBeenCalledWith(5, updateData)
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'update-suggestions',
        expect.objectContaining({ id: 5, action: 'updated' }),
      )
    })
  })

  describe('updatePoster', () => {
    it('throws NotFoundException when record does not exist', async () => {
      mockRepo.findById = mock(() => Promise.resolve(null))

      await expect(service.updatePoster(999, 'https://example.com/poster.jpg')).rejects.toThrow(
        NotFoundException,
      )
      expect(mockRepo.update).not.toHaveBeenCalled()
    })

    it('fetches image, updates posterUrl with original url, and emits update-records', async () => {
      const existing = makeRecord({ id: 8, genre: RecordGenre.ANIME })
      const url = 'https://example.com/poster.jpg'
      const updated = makeRecord({
        id: 8,
        genre: RecordGenre.ANIME,
        posterUrl: url,
      })

      mockRepo.findById = mock(() => Promise.resolve(existing))
      mockImgService.getImageContent = mock(() =>
        Promise.resolve({ buffer: Buffer.from([]), contentType: 'image/webp' }),
      )
      mockRepo.update = mock(() => Promise.resolve(updated))

      const result = await service.updatePoster(8, url)

      const expectedBase64 = Buffer.from(url, 'utf8').toString('base64')
      expect(mockImgService.getImageContent).toHaveBeenCalledWith(expectedBase64)
      expect(mockRepo.update).toHaveBeenCalledWith(8, { posterUrl: url })
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'update-records',
        expect.objectContaining({ id: 8, genre: RecordGenre.ANIME, action: 'updated' }),
      )
      expect(result).toEqual(updated as any)
    })

    it('encodes non-ASCII poster URLs as UTF-8 base64', async () => {
      const existing = makeRecord({ id: 9, genre: RecordGenre.ANIME })
      const url = 'https://example.com/постер.jpg'
      const updated = makeRecord({ id: 9, genre: RecordGenre.ANIME, posterUrl: url })

      mockRepo.findById = mock(() => Promise.resolve(existing))
      mockImgService.getImageContent = mock(() =>
        Promise.resolve({ buffer: Buffer.from([]), contentType: 'image/webp' }),
      )
      mockRepo.update = mock(() => Promise.resolve(updated))

      await service.updatePoster(9, url)

      expect(mockImgService.getImageContent).toHaveBeenCalledWith(
        'aHR0cHM6Ly9leGFtcGxlLmNvbS/Qv9C+0YHRgtC10YAuanBn',
      )
    })
  })

  describe('deleteRecord', () => {
    it('throws NotFoundException when record not found', async () => {
      mockRepo.findById = mock(() => Promise.resolve(null))

      await expect(service.deleteRecord(999)).rejects.toThrow(NotFoundException)
      expect(mockRepo.delete).not.toHaveBeenCalled()
    })

    it('deletes record and emits update-records', async () => {
      const record = makeRecord({ id: 3, type: RecordType.WRITTEN, status: RecordStatus.DONE })
      mockRepo.findById = mock(() => Promise.resolve(record))
      mockRepo.delete = mock(() => Promise.resolve())

      await service.deleteRecord(3)

      expect(mockRepo.delete).toHaveBeenCalledWith(3)
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'update-records',
        expect.objectContaining({ id: 3, action: 'deleted' }),
      )
    })

    it('emits update-suggestions on SUGGESTION type delete', async () => {
      const record = makeRecord({ id: 4, type: RecordType.SUGGESTION })
      mockRepo.findById = mock(() => Promise.resolve(record))
      mockRepo.delete = mock(() => Promise.resolve())

      await service.deleteRecord(4)

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'update-suggestions',
        expect.objectContaining({ id: 4, action: 'deleted' }),
      )
    })
  })

  describe('getAllRecords', () => {
    it('calls count and findAll with correct filter/sort/pagination', async () => {
      const records = [makeRecord(), makeRecord({ id: 2 })]
      mockRepo.count = mock(() => Promise.resolve(10))
      mockRepo.findAll = mock(() => Promise.resolve(records))

      const result = await service.getAllRecords(
        2,
        5,
        { status: [RecordStatus.QUEUE] },
        'title',
        'asc',
      )

      expect(mockRepo.count).toHaveBeenCalledWith(
        expect.objectContaining({ status: [RecordStatus.QUEUE] }),
      )
      expect(mockRepo.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ status: [RecordStatus.QUEUE] }),
        { orderBy: 'title', direction: 'asc' },
        { skip: 5, take: 5 },
      )
      expect(result.total).toBe(10)
      expect(result.records).toMatchObject([
        { id: 1, communityTotal: 0, communityTop: null, myGrade: null },
        { id: 2, communityTotal: 0, communityTop: null, myGrade: null },
      ])
    })

    it('attaches community aggregates and my grade for a logged-in user', async () => {
      mockRepo.count = mock(() => Promise.resolve(2))
      mockRepo.findAll = mock(() => Promise.resolve([makeRecord({ id: 1 }), makeRecord({ id: 2 })]))
      mockRatingRepo.aggregateByRecords = mock((ids: number[]) =>
        Promise.resolve(
          new Map(
            ids.map((id) => [
              id,
              {
                counts: {
                  [RecordGrade.DISLIKE]: 1,
                  [RecordGrade.BEER]: 2,
                  [RecordGrade.LIKE]: 3,
                  [RecordGrade.RECOMMEND]: 4,
                },
                total: 10,
                top: RecordGrade.RECOMMEND,
              },
            ]),
          ),
        ),
      )
      mockRatingRepo.findMyGrades = mock(() => Promise.resolve(new Map([[1, RecordGrade.LIKE]])))

      const result = await service.getAllRecords(1, 10, {}, undefined, undefined, 'user-1')

      expect(mockRatingRepo.aggregateByRecords).toHaveBeenCalledWith([1, 2])
      expect(mockRatingRepo.findMyGrades).toHaveBeenCalledWith('user-1', [1, 2])
      expect(result.records).toMatchObject([
        {
          id: 1,
          communityTotal: 10,
          communityTop: RecordGrade.RECOMMEND,
          myGrade: RecordGrade.LIKE,
        },
        { id: 2, communityTotal: 10, communityTop: RecordGrade.RECOMMEND, myGrade: null },
      ])
    })
  })

  describe('findRecordById', () => {
    it('returns the record when found', async () => {
      const record = makeRecord({ id: 7 })
      mockRepo.findById = mock(() => Promise.resolve(record))

      const result = await service.findRecordById(7)

      expect(mockRepo.findById).toHaveBeenCalledWith(7)
      expect(result).toMatchObject({ id: 7, communityTotal: 0, communityTop: null, myGrade: null })
    })

    it('attaches community view with my grade for a logged-in user', async () => {
      mockRepo.findById = mock(() => Promise.resolve(makeRecord({ id: 7 })))
      mockRatingRepo.findMyGrades = mock(() => Promise.resolve(new Map([[7, RecordGrade.BEER]])))

      const result = await service.findRecordById(7, 'user-1')

      expect(mockRatingRepo.aggregateByRecords).toHaveBeenCalledWith([7])
      expect(mockRatingRepo.findMyGrades).toHaveBeenCalledWith('user-1', [7])
      expect(result).toMatchObject({ id: 7, communityTotal: 0, myGrade: RecordGrade.BEER })
    })

    it('throws NotFoundException when not found', async () => {
      mockRepo.findById = mock(() => Promise.resolve(null))

      await expect(service.findRecordById(0)).rejects.toThrow(NotFoundException)
    })
  })
})
