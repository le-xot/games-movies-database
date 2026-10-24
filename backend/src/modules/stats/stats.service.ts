import { DrizzleStatsRepository } from '@/modules/stats/repositories/drizzle-stats.repository'
import { RecordsStatsDTO } from '@/modules/stats/stats.dto'

export class StatsService {
  constructor(private readonly statsRepository: DrizzleStatsRepository) {}

  async getRecordsStats(): Promise<RecordsStatsDTO> {
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
