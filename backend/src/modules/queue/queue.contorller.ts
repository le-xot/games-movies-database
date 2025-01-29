import { Controller, Get } from '@nestjs/common'
import { ApiResponse } from '@nestjs/swagger'
import { QueueDto } from './queue.dto'
import { QueueService } from './queue.service'

@Controller('queue')
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Get()
  @ApiResponse({ status: 200, type: QueueDto })
  async getQueue(): Promise<QueueDto> {
    return await this.queueService.getQueue()
  }
}
