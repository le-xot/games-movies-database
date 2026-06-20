import { Module } from '@nestjs/common'
import { PrismaModule } from '@/database/prisma.module'
import { QueueController } from '@/modules/queue/queue.controller'
import { QueueService } from '@/modules/queue/queue.service'
import { UserModule } from '@/modules/user/user.module'
import { PrismaQueueRepository } from './repositories/prisma-queue.repository'
import { QueueRepository } from './repositories/queue.repository'

@Module({
  imports: [PrismaModule, UserModule],
  providers: [QueueService, { provide: QueueRepository, useClass: PrismaQueueRepository }],
  controllers: [QueueController],
})
export class QueueModule {}
