import { Module } from '@nestjs/common'
import { PrismaModule } from '../../database/prisma.module'
import { UserModule } from '../user/user.module'
import { QueueController } from './queue.contorller'
import { QueueService } from './queue.service'

@Module({
  imports: [PrismaModule, UserModule],
  providers: [QueueService],
  controllers: [QueueController],
})
export class QueueModule {}
