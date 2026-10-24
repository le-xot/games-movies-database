import { Injectable, Logger } from '@nestjs/common'
import { RedisClient } from 'bun'
import { hitRateLimit, type RateLimitResult } from '@/utils/rate-limit'
import type { RateLimitConfig } from '@/utils/rate-limits'

@Injectable()
export class RateLimitService {
  private readonly logger = new Logger(RateLimitService.name)

  constructor(private readonly client: RedisClient) {}

  async hit(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
    return await hitRateLimit(this.client, key, config, (error) => {
      this.logger.warn(`Redis unavailable, rate limit skipped: ${String(error)}`)
    })
  }
}
