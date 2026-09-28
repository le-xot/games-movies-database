import { Injectable, Logger } from '@nestjs/common'
import { RedisClient } from 'bun'
import type { RateLimitConfig } from '@/utils/rate-limits'

const INCREMENT_SCRIPT = `
local count = redis.call('INCR', KEYS[1])
if count == 1 then
  redis.call('PEXPIRE', KEYS[1], ARGV[2])
end
return {count, redis.call('PTTL', KEYS[1])}
`

export interface RateLimitResult {
  allowed: boolean
  retryAfterSeconds: number
}

@Injectable()
export class RateLimitService {
  private readonly logger = new Logger(RateLimitService.name)

  constructor(private readonly client: RedisClient) {}

  async hit(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
    try {
      const result: unknown = await this.client.send('EVAL', [
        INCREMENT_SCRIPT,
        '1',
        key,
        String(config.limit),
        String(config.ttl),
      ])
      if (!Array.isArray(result) || result.length < 2) {
        throw new Error('Unexpected EVAL reply from Redis')
      }
      const count = Number(result[0])
      const pttl = Number(result[1])
      return {
        allowed: count <= config.limit,
        retryAfterSeconds: Math.max(1, Math.ceil(pttl / 1000)),
      }
    } catch (error) {
      this.logger.warn(`Redis unavailable, rate limit skipped: ${String(error)}`)
      return { allowed: true, retryAfterSeconds: 0 }
    }
  }
}
