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

export type RateLimitClient = Pick<RedisClient, 'send'>

/**
 * Fixed-window счётчик на Redis. Вынесен из Nest-сервиса, чтобы им пользовался и
 * старый слой, и Elysia-гейтвей: две реализации одного лимита разъедутся молча.
 *
 * Считаем атомарно через Lua: INCR + PEXPIRE на первом запросе окна.
 */
export async function hitRateLimit(
  client: RateLimitClient,
  key: string,
  config: RateLimitConfig,
  onError?: (error: unknown) => void,
): Promise<RateLimitResult> {
  try {
    const result: unknown = await client.send('EVAL', [
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
    // Fail-open: лимит — защита от абуза, но не повод ронять сайт вместе с Redis.
    onError?.(error)
    return { allowed: true, retryAfterSeconds: 0 }
  }
}
