import { Module } from '@nestjs/common'
import { RedisClient } from 'bun'
import { env } from '@/utils/enviroments'
import { RateLimitGuard } from './rate-limit.guard'
import { RateLimitService } from './rate-limit.service'

@Module({
  providers: [
    {
      provide: RedisClient,
      useFactory: () => new RedisClient(env.REDIS_URL),
    },
    RateLimitService,
    RateLimitGuard,
  ],
  exports: [RateLimitService],
})
export class RateLimitModule {}
