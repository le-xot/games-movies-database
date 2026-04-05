import { Module } from '@nestjs/common'
import { PrismaModule } from '@/database/prisma.module'
import { LimitController } from '@/modules/limit/limit.controller'
import { LimitService } from '@/modules/limit/limit.service'
import { UserModule } from '@/modules/user/user.module'
import { LimitRepository } from './repositories/limit.repository'
import { PrismaLimitRepository } from './repositories/prisma-limit.repository'

@Module({
  imports: [PrismaModule, UserModule],
  controllers: [LimitController],
  providers: [LimitService, { provide: LimitRepository, useClass: PrismaLimitRepository }, PrismaLimitRepository],
  exports: [LimitService],
})
export class LimitModule {}
