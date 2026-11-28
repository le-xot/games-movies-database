import { DrizzleStatsRepository } from '@backend/modules/stats/repositories/drizzle-stats.repository'
import type { RecordsStats } from '@backend/modules/stats/stats.entity'

export class StatsService {
  constructor(private readonly statsRepository: DrizzleStatsRepository) {}

  async getRecordsStats(): Promise<RecordsStats> {
    const [
      total,
      byGenre,
      byStatus,
      byGrade,
      byFriendsGrade,
      byFriendsGenreGrade,
      byGenreStatus,
      byGenreGrade,
    ] = await Promise.all([
      this.statsRepository.countTotal(),
      this.statsRepository.countByGenre(),
      this.statsRepository.countByStatus(),
      this.statsRepository.countByGrade(),
      this.statsRepository.countByFriendsGrade(),
      this.statsRepository.countByFriendsGenreGrade(),
      this.statsRepository.countByGenreStatus(),
      this.statsRepository.countByGenreGrade(),
    ])

    return {
      total,
      byGenre,
      byStatus,
      byGrade,
      byFriendsGrade,
      byFriendsGenreGrade,
      byGenreStatus,
      byGenreGrade,
    }
  }
}
