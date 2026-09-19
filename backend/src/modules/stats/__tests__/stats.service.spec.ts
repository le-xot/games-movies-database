import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { createMock } from '@/__tests__/helpers/mock-factory'
import { RecordGenre, RecordGrade, RecordStatus } from '@/enums'
import { DrizzleStatsRepository } from '../repositories/drizzle-stats.repository'
import { StatsService } from '../stats.service'

describe('StatsService', () => {
  let service: StatsService
  let mockRepo: DrizzleStatsRepository

  beforeEach(() => {
    mockRepo = createMock(DrizzleStatsRepository)
    service = new StatsService(mockRepo)
  })

  it('composes total and breakdowns from repository', async () => {
    mockRepo.countTotal = mock(() => Promise.resolve(42))
    mockRepo.countByGenre = mock(() =>
      Promise.resolve([
        { genre: RecordGenre.MOVIE, count: 20 },
        { genre: RecordGenre.GAME, count: 22 },
      ]),
    )
    mockRepo.countByStatus = mock(() =>
      Promise.resolve([
        { status: RecordStatus.DONE, count: 30 },
        { status: RecordStatus.QUEUE, count: 12 },
      ]),
    )
    mockRepo.countByGrade = mock(() =>
      Promise.resolve([{ grade: RecordGrade.RECOMMEND, count: 25 }]),
    )
    mockRepo.countByGenreStatus = mock(() =>
      Promise.resolve([
        { genre: RecordGenre.MOVIE, status: RecordStatus.DONE, count: 18 },
        { genre: RecordGenre.GAME, status: RecordStatus.DROP, count: 4 },
      ]),
    )
    mockRepo.countByGenreGrade = mock(() =>
      Promise.resolve([
        { genre: RecordGenre.MOVIE, grade: RecordGrade.LIKE, count: 12 },
        { genre: RecordGenre.GAME, grade: RecordGrade.BEER, count: 9 },
      ]),
    )

    const result = await service.getRecordsStats()

    expect(result).toEqual({
      total: 42,
      byGenre: [
        { genre: RecordGenre.MOVIE, count: 20 },
        { genre: RecordGenre.GAME, count: 22 },
      ],
      byStatus: [
        { status: RecordStatus.DONE, count: 30 },
        { status: RecordStatus.QUEUE, count: 12 },
      ],
      byGrade: [{ grade: RecordGrade.RECOMMEND, count: 25 }],
      byGenreStatus: [
        { genre: RecordGenre.MOVIE, status: RecordStatus.DONE, count: 18 },
        { genre: RecordGenre.GAME, status: RecordStatus.DROP, count: 4 },
      ],
      byGenreGrade: [
        { genre: RecordGenre.MOVIE, grade: RecordGrade.LIKE, count: 12 },
        { genre: RecordGenre.GAME, grade: RecordGrade.BEER, count: 9 },
      ],
    })
    expect(mockRepo.countTotal).toHaveBeenCalledTimes(1)
    expect(mockRepo.countByGenre).toHaveBeenCalledTimes(1)
    expect(mockRepo.countByStatus).toHaveBeenCalledTimes(1)
    expect(mockRepo.countByGrade).toHaveBeenCalledTimes(1)
    expect(mockRepo.countByGenreStatus).toHaveBeenCalledTimes(1)
    expect(mockRepo.countByGenreGrade).toHaveBeenCalledTimes(1)
  })

  it('returns empty breakdowns for an empty database', async () => {
    mockRepo.countTotal = mock(() => Promise.resolve(0))
    mockRepo.countByGenre = mock(() => Promise.resolve([]))
    mockRepo.countByStatus = mock(() => Promise.resolve([]))
    mockRepo.countByGrade = mock(() => Promise.resolve([]))
    mockRepo.countByGenreStatus = mock(() => Promise.resolve([]))
    mockRepo.countByGenreGrade = mock(() => Promise.resolve([]))

    const result = await service.getRecordsStats()

    expect(result).toEqual({
      total: 0,
      byGenre: [],
      byStatus: [],
      byGrade: [],
      byGenreStatus: [],
      byGenreGrade: [],
    })
  })
})
