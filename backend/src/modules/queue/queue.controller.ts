import { Controller, Get } from '@nestjs/common'
import { ApiResponse } from '@nestjs/swagger'
import { QueueDto } from '@/modules/queue/queue.dto'
import { QueueService } from '@/modules/queue/queue.service'

@Controller('queue')
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Get()
  @ApiResponse({ status: 200, type: QueueDto })
  async getQueue(): Promise<QueueDto> {
    return await this.queueService.getQueue()
  }
}
