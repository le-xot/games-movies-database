import { Module } from '@nestjs/common'
import { PrismaModule } from '@/database/prisma.module'
import { LimitController } from '@/modules/limit/limit.controller'
import { LimitService } from '@/modules/limit/limit.service'
import { UserModule } from '@/modules/user/user.module'

@Module({
  imports: [PrismaModule, UserModule],
  controllers: [LimitController],
  providers: [LimitService],
  exports: [LimitService],
})
export class LimitModule {}
