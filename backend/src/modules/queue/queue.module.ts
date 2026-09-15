import { Module } from '@nestjs/common'
import { DrizzleModule } from '@/database/drizzle.module'
import { QueueController } from '@/modules/queue/queue.controller'
import { QueueService } from '@/modules/queue/queue.service'
import { DrizzleQueueRepository } from './repositories/drizzle-queue.repository'

@Module({
  imports: [DrizzleModule],
  providers: [QueueService, DrizzleQueueRepository],
  controllers: [QueueController],
})
export class QueueModule {}
