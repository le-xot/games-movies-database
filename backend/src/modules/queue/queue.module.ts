import { Module } from '@nestjs/common'
import { DrizzleModule } from '@/database/drizzle.module'
import { QueueController } from '@/modules/queue/queue.controller'
import { QueueService } from '@/modules/queue/queue.service'
import { UserModule } from '@/modules/user/user.module'
import { DrizzleQueueRepository } from './repositories/drizzle-queue.repository'
import { QueueRepository } from './repositories/queue.repository'

@Module({
  imports: [DrizzleModule, UserModule],
  providers: [QueueService, { provide: QueueRepository, useClass: DrizzleQueueRepository }],
  controllers: [QueueController],
})
export class QueueModule {}
