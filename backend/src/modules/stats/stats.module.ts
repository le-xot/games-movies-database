import { Module } from '@nestjs/common'
import { DrizzleModule } from '@/database/drizzle.module'
import { DrizzleStatsRepository } from '@/modules/stats/repositories/drizzle-stats.repository'
import { StatsController } from '@/modules/stats/stats.controller'
import { StatsService } from '@/modules/stats/stats.service'

@Module({
  imports: [DrizzleModule],
  controllers: [StatsController],
  providers: [StatsService, DrizzleStatsRepository],
})
export class StatsModule {}
