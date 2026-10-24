import { describe, expect, it } from 'bun:test'
import { hitRateLimit, type RateLimitClient } from '../rate-limit'

const CONFIG = { limit: 5, ttl: 60_000 }

function client(send: () => Promise<unknown>): RateLimitClient {
  return { send } as unknown as RateLimitClient
}

describe('hitRateLimit', () => {
  it('counts the request within the window', async () => {
    const result = await hitRateLimit(
      client(async () => [3, 42_000]),
      'rl:test:1.2.3.4',
      CONFIG,
    )

    expect(result).toEqual({ allowed: true, retryAfterSeconds: 42 })
  })

  it('blocks a request over the limit', async () => {
    const result = await hitRateLimit(
      client(async () => [6, 1_000]),
      'rl:test:1.2.3.4',
      CONFIG,
    )

    expect(result).toEqual({ allowed: false, retryAfterSeconds: 1 })
  })

  it('fails open when Redis rejects', async () => {
    const result = await hitRateLimit(
      client(async () => {
        throw new Error('connection refused')
      }),
      'rl:test:1.2.3.4',
      CONFIG,
    )

    expect(result).toEqual({ allowed: true, retryAfterSeconds: 0 })
  })

  it('fails open quickly instead of hanging on a dead Redis', async () => {
    // Bun.redis переподключается десятками секунд: без таймаута «fail-open»
    // растягивается на ~31 с и вешает запрос.
    const started = performance.now()

    const result = await hitRateLimit(
      client(() => new Promise<never>(() => {})),
      'rl:test:1.2.3.4',
      CONFIG,
    )

    expect(result).toEqual({ allowed: true, retryAfterSeconds: 0 })
    expect(performance.now() - started).toBeLessThan(2_000)
  })
})
