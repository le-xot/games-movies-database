import { Controller, Get } from '@nestjs/common'
import { ApiResponse, ApiTags } from '@nestjs/swagger'
import { RecordsStatsDTO } from '@/modules/stats/stats.dto'
import { StatsService } from '@/modules/stats/stats.service'

@ApiTags('stats')
@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('records')
  @ApiResponse({ status: 200, type: RecordsStatsDTO })
  async getRecordsStats(): Promise<RecordsStatsDTO> {
    return await this.statsService.getRecordsStats()
  }
}
