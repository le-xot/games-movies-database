import { Module } from '@nestjs/common'
import { PrismaModule } from 'src/database/prisma.module'
import { UserModule } from '../user/user.module'
import { LimitController } from './limit.controller'
import { LimitService } from './limit.service'

@Module({
  imports: [PrismaModule, UserModule],
  controllers: [LimitController],
  providers: [LimitService],
  exports: [LimitService],
})
export class LimitModule {}
