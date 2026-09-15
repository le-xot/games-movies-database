import { Module } from '@nestjs/common'
import { DrizzleModule } from '@/database/drizzle.module'
import { LimitController } from '@/modules/limit/limit.controller'
import { LimitService } from '@/modules/limit/limit.service'
import { UserModule } from '@/modules/user/user.module'
import { DrizzleLimitRepository } from './repositories/drizzle-limit.repository'
import { LimitRepository } from './repositories/limit.repository'

@Module({
  imports: [DrizzleModule, UserModule],
  controllers: [LimitController],
  providers: [
    LimitService,
    { provide: LimitRepository, useClass: DrizzleLimitRepository },
    DrizzleLimitRepository,
  ],
  exports: [LimitService],
})
export class LimitModule {}
