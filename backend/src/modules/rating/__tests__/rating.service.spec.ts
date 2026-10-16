import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { NotFoundException } from '@nestjs/common'
import { RecordGrade } from '@/enums'
import { RatingService } from '../rating.service'
import { DrizzleRatingRepository } from '../repositories/drizzle-rating.repository'
import type { DrizzleService } from '@/database/drizzle.service'

const makeRating = (
  overrides?: Partial<{ id: string; userId: string; recordId: number; grade: RecordGrade }>,
) => ({
  id: 'rating-1',
  userId: 'user-1',
  recordId: 1,
  grade: RecordGrade.LIKE,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

function makeDrizzle(recordRow: { id: number } | null) {
  return {
    db: { query: { records: { findFirst: mock(() => Promise.resolve(recordRow)) } } },
  } as unknown as DrizzleService
}

describe('RatingService', () => {
  let service: RatingService
  let mockRepo: DrizzleRatingRepository
  let mockEventEmitter: { emit: ReturnType<typeof mock> }

  beforeEach(() => {
    mockRepo = {
      findByUserAndRecord: mock(() => Promise.resolve(null)),
      upsert: mock((userId: string, recordId: number, grade: RecordGrade) =>
        Promise.resolve(makeRating({ userId, recordId, grade })),
      ),
      deleteByUserAndRecord: mock(() => Promise.resolve(1)),
    } as unknown as DrizzleRatingRepository
    mockEventEmitter = { emit: mock(() => {}) }
    service = new RatingService(mockRepo, makeDrizzle({ id: 1 }), mockEventEmitter as any)
  })

  describe('rate', () => {
    it('creates a rating when none exists and emits created', async () => {
      const result = await service.rate('user-1', 1, RecordGrade.RECOMMEND)

      expect(mockRepo.findByUserAndRecord).toHaveBeenCalledWith('user-1', 1)
      expect(mockRepo.upsert).toHaveBeenCalledWith('user-1', 1, RecordGrade.RECOMMEND)
      expect(result.grade).toBe(RecordGrade.RECOMMEND)
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'update-ratings',
        expect.objectContaining({
          userId: 'user-1',
          recordId: 1,
          grade: RecordGrade.RECOMMEND,
          action: 'created',
        }),
      )
    })

    it('updates a rating when one exists and emits updated', async () => {
      mockRepo.findByUserAndRecord = mock(() => Promise.resolve(makeRating())) as any

      await service.rate('user-1', 1, RecordGrade.DISLIKE)

      expect(mockRepo.upsert).toHaveBeenCalledWith('user-1', 1, RecordGrade.DISLIKE)
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'update-ratings',
        expect.objectContaining({ action: 'updated', grade: RecordGrade.DISLIKE }),
      )
    })

    it('throws NotFoundException for a missing record without touching ratings', async () => {
      service = new RatingService(mockRepo, makeDrizzle(null), mockEventEmitter as any)

      await expect(service.rate('user-1', 999, RecordGrade.LIKE)).rejects.toThrow(NotFoundException)
      expect(mockRepo.upsert).not.toHaveBeenCalled()
      expect(mockEventEmitter.emit).not.toHaveBeenCalled()
    })
  })

  describe('unrate', () => {
    it('deletes a rating and emits deleted with null grade', async () => {
      await service.unrate('user-1', 1)

      expect(mockRepo.deleteByUserAndRecord).toHaveBeenCalledWith('user-1', 1)
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'update-ratings',
        expect.objectContaining({
          userId: 'user-1',
          recordId: 1,
          grade: null,
          action: 'deleted',
        }),
      )
    })

    it('throws NotFoundException if nothing was deleted', async () => {
      mockRepo.deleteByUserAndRecord = mock(() => Promise.resolve(0)) as any

      await expect(service.unrate('user-1', 1)).rejects.toThrow(NotFoundException)
      expect(mockEventEmitter.emit).not.toHaveBeenCalled()
    })
  })
})
