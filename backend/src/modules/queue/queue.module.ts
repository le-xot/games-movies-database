import { PrismaModule } from '@/database/prisma.module'
import { Module } from '@nestjs/common'
import { UserModule } from '../user/user.module'
import { QueueController } from './queue.controller'
import { QueueService } from './queue.service'

@Module({
  imports: [PrismaModule, UserModule],
  providers: [QueueService],
  controllers: [QueueController],
})
export class QueueModule {}
