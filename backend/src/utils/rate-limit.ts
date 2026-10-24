import { RedisClient } from 'bun'
import type { RateLimitConfig } from '@backend/utils/rate-limits'

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
 * Сколько ждём Redis. Клиент Bun переподключается десятками секунд, и без
 * ограничения «fail-open» превращается в зависший запрос: замерено ~31 с на
 * первом обращении после падения Redis.
 */
const REDIS_TIMEOUT_MS = 250

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined

  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('Redis не ответил вовремя')), ms)
  })

  // Проигравшая гонку ветка не должна всплыть как unhandledRejection.
  promise.catch(() => {})

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer))
}

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
    const result: unknown = await withTimeout(
      client.send('EVAL', [
        INCREMENT_SCRIPT,
        '1',
        key,
        String(config.limit),
        String(config.ttl),
      ]) as Promise<unknown>,
      REDIS_TIMEOUT_MS,
    )

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
