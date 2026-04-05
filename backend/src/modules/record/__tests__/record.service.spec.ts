import { NotFoundException } from '@nestjs/common'
import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { createMock } from '@/__tests__/helpers/mock-factory'
import { RecordGenre, RecordStatus, RecordType } from '@/enums'
import type { RecordWithRelations } from '@/modules/record/entities/record-domain.entity'
import { RecordRepository } from '../repositories/record.repository'
import { RecordService } from '../record.service'

const makeRecord = (overrides?: Partial<RecordWithRelations>): RecordWithRelations => ({
  id: 1,
  title: 'Test Record',
  link: 'https://example.com/1',
  posterUrl: 'http://img.example.com/1.jpg',
  status: RecordStatus.QUEUE,
  type: RecordType.WRITTEN,
  genre: RecordGenre.ANIME,
  userId: 'user-1',
  ...overrides,
})

describe('RecordService', () => {
  let service: RecordService
  let mockRepo: RecordRepository
  let mockRecordsProvider: { prepareData: ReturnType<typeof mock> }
  let mockEventEmitter: { emit: ReturnType<typeof mock> }

  beforeEach(() => {
    mockRepo = createMock(RecordRepository)
    mockRecordsProvider = { prepareData: mock(() => {}) }
    mockEventEmitter = { emit: mock(() => {}) }
    service = new RecordService(
      mockRepo,
      mockRecordsProvider as any,
      mockEventEmitter as any,
    )
  })

  describe('createRecordFromLink', () => {
    it('creates a record and emits update-queue event for QUEUE+WRITTEN', async () => {
      const preparedData = { title: 'New Record', posterUrl: 'http://img', genre: RecordGenre.ANIME }
      const created = makeRecord({ id: 10, status: RecordStatus.QUEUE, type: RecordType.WRITTEN })

      mockRecordsProvider.prepareData = mock(() => Promise.resolve(preparedData))
      mockRepo.create = mock(() => Promise.resolve(created))

      const user: any = { id: 'user-1' }
      const dto: any = { link: 'https://example.com/1' }

      await service.createRecordFromLink(user, dto)

      expect(mockRepo.create).toHaveBeenCalledTimes(1)
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'update-queue',
        expect.objectContaining({ id: 10, action: 'created' }),
      )
    })

    it('emits update-suggestions event for SUGGESTION type', async () => {
      const preparedData = { title: 'Suggestion', posterUrl: 'http://img', genre: RecordGenre.ANIME }
      const created = makeRecord({ id: 11, type: RecordType.SUGGESTION, status: RecordStatus.QUEUE })

      mockRecordsProvider.prepareData = mock(() => Promise.resolve(preparedData))
      mockRepo.create = mock(() => Promise.resolve(created))

      await service.createRecordFromLink({ id: 'user-1' } as any, { link: 'https://example.com' } as any)

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'update-suggestions',
        expect.objectContaining({ id: 11, action: 'created' }),
      )
    })

    it('emits update-auction event for AUCTION type', async () => {
      const preparedData = { title: 'Auction Item', posterUrl: 'http://img', genre: RecordGenre.GAME }
      const created = makeRecord({ id: 12, type: RecordType.AUCTION, status: RecordStatus.QUEUE })

      mockRecordsProvider.prepareData = mock(() => Promise.resolve(preparedData))
      mockRepo.create = mock(() => Promise.resolve(created))

      await service.createRecordFromLink({ id: 'user-1' } as any, { link: 'https://example.com' } as any)

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'update-auction',
        expect.objectContaining({ id: 12, action: 'created' }),
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

      const result = await service.getAllRecords(2, 5, { status: RecordStatus.QUEUE }, 'title', 'asc')

      expect(mockRepo.count).toHaveBeenCalledWith(
        expect.objectContaining({ status: RecordStatus.QUEUE }),
      )
      expect(mockRepo.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ status: RecordStatus.QUEUE }),
        { orderBy: 'title', direction: 'asc' },
        { skip: 5, take: 5 },
      )
      expect(result.total).toBe(10)
      expect(result.records).toEqual(records as any)
    })
  })

  describe('findRecordById', () => {
    it('returns the record when found', async () => {
      const record = makeRecord({ id: 7 })
      mockRepo.findById = mock(() => Promise.resolve(record))

      const result = await service.findRecordById(7)

      expect(mockRepo.findById).toHaveBeenCalledWith(7)
      expect(result).toEqual(record as any)
    })

    it('throws NotFoundException when not found', async () => {
      mockRepo.findById = mock(() => Promise.resolve(null))

      await expect(service.findRecordById(0)).rejects.toThrow(NotFoundException)
    })
  })
})
