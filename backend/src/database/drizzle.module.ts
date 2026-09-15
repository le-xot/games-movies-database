import { Module } from '@nestjs/common'
import { DrizzleService } from '@/database/drizzle.service'

@Module({
  providers: [DrizzleService],
  exports: [DrizzleService],
})
export class DrizzleModule {}
