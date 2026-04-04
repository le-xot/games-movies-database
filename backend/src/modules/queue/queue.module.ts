import { Module } from '@nestjs/common'
import { PrismaModule } from '@/database/prisma.module'
import { QueueController } from '@/modules/queue/queue.controller'
import { QueueService } from '@/modules/queue/queue.service'
import { UserModule } from '@/modules/user/user.module'

@Module({
  imports: [PrismaModule, UserModule],
  providers: [QueueService],
  controllers: [QueueController],
})
export class QueueModule {}
