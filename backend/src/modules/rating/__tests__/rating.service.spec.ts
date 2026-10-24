import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { RecordGrade } from '@backend/enums'
import { NotFoundException } from '@backend/utils/errors'
import { RatingService } from '../rating.service'
import { DrizzleRatingRepository } from '../repositories/drizzle-rating.repository'
import type { DrizzleService } from '@backend/database/drizzle.service'

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

function makeDrizzle(
  recordRow: { id: number } | null,
  userRow: { id: string; login: string } | null = { id: 'user-1', login: 'user-1' },
) {
  return {
    db: {
      query: {
        records: { findFirst: mock(() => Promise.resolve(recordRow)) },
        users: { findFirst: mock(() => Promise.resolve(userRow)) },
      },
    },
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

  describe('getUserRatings', () => {
    const makeRow = (overrides?: Record<string, unknown>) => ({
      rating: {
        id: 'rating-1',
        userId: 'owner-1',
        recordId: 7,
        grade: RecordGrade.RECOMMEND,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      record: { id: 7, title: 'Owned' },
      ...overrides,
    })

    beforeEach(() => {
      service = new RatingService(
        mockRepo,
        makeDrizzle({ id: 1 }, { id: 'owner-1', login: 'owner-login' }),
        mockEventEmitter as any,
      )
      mockRepo.findByUserWithRecords = mock(() => Promise.resolve([makeRow()])) as any
      mockRepo.countByUser = mock(() => Promise.resolve(1)) as any
      mockRepo.aggregateByRecords = mock(() =>
        Promise.resolve(
          new Map([
            [
              7,
              {
                counts: { DISLIKE: 0, BEER: 0, LIKE: 0, RECOMMEND: 2 },
                total: 2,
                top: RecordGrade.RECOMMEND,
              },
            ],
          ]),
        ),
      ) as any
      mockRepo.findMyGrades = mock(() => Promise.resolve(new Map([[7, RecordGrade.LIKE]]))) as any
    })

    it('returns profile ratings with friends, viewer vote and login', async () => {
      const result = await service.getUserRatings('viewer-1', 'owner-1', 2, 10, undefined)

      expect(mockRepo.findByUserWithRecords).toHaveBeenCalledWith('owner-1', undefined, 10, 10)
      expect(mockRepo.countByUser).toHaveBeenCalledWith('owner-1', undefined)
      expect(result.total).toBe(1)
      expect(result.items[0]).toMatchObject({
        id: 7,
        title: 'Owned',
        friendsTotal: 2,
        friendsTop: RecordGrade.RECOMMEND,
        myGrade: RecordGrade.LIKE,
        userGrade: RecordGrade.RECOMMEND,
        userLogin: 'owner-login',
      })
    })

    it('skips viewer lookup for guests', async () => {
      const result = await service.getUserRatings(undefined, 'owner-1', 1, 10, undefined)

      expect(mockRepo.findMyGrades).not.toHaveBeenCalled()
      expect(result.items[0]).toMatchObject({ myGrade: null, userGrade: RecordGrade.RECOMMEND })
    })

    it('throws NotFoundException for unknown profile user', async () => {
      service = new RatingService(mockRepo, makeDrizzle({ id: 1 }, null), mockEventEmitter as any)

      await expect(service.getUserRatings('viewer-1', 'ghost', 1, 10, undefined)).rejects.toThrow(
        NotFoundException,
      )
      expect(mockRepo.findByUserWithRecords).not.toHaveBeenCalled()
    })
  })

  describe('getFriends', () => {
    it('returns members sorted by votes desc with totals', async () => {
      mockRepo.getFriendsOverview = mock(() =>
        Promise.resolve([
          {
            userId: 'u2',
            login: 'second',
            profileImageUrl: '',
            counts: { DISLIKE: 0, BEER: 1, LIKE: 0, RECOMMEND: 0 },
          },
          {
            userId: 'u1',
            login: 'first',
            profileImageUrl: 'img',
            counts: { DISLIKE: 0, BEER: 0, LIKE: 2, RECOMMEND: 3 },
          },
        ]),
      ) as any

      const result = await service.getFriends()

      expect(mockRepo.getFriendsOverview).toHaveBeenCalledTimes(1)
      expect(result.map((member) => [member.login, member.total])).toEqual([
        ['first', 5],
        ['second', 1],
      ])
      expect(result[0]).toMatchObject({
        userId: 'u1',
        profileImageUrl: 'img',
        counts: { DISLIKE: 0, BEER: 0, LIKE: 2, RECOMMEND: 3 },
      })
    })

    it('returns an empty list when nobody voted', async () => {
      mockRepo.getFriendsOverview = mock(() => Promise.resolve([])) as any

      await expect(service.getFriends()).resolves.toEqual([])
    })
  })
})
