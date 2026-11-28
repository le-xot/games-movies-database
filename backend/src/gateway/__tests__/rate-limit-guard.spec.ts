import { describe, expect, it } from 'bun:test'
import { createTestGateway } from '@backend/__tests__/helpers/gateway-stub'
import { rateLimitGuard } from '@backend/gateway/rate-limit'
import { RATE_LIMITS } from '@backend/utils/rate-limits'

function capturingLimiter() {
  const keys: string[] = []
  const limiter = {
    hit: async (key: string) => {
      keys.push(key)
      return { allowed: true, retryAfterSeconds: 1 }
    },
  }

  return { keys, limiter }
}

/**
 * Ловушка на ключ лимита: ключ — метод + зарегистрированный путь из
 * `ctx.route`, а не URL запроса. Иначе лимит обходится перебором id
 * (`/records/1`, `/records/2`, …), у каждого значения свой счётчик.
 */
describe('rateLimitGuard', () => {
  it('не зависит от параметров пути: /records/1 и /records/2 — один ключ', async () => {
    const { keys, limiter } = capturingLimiter()
    const app = createTestGateway({ rateLimit: limiter })

    await app.handle(new Request('http://localhost/records/1'))
    await app.handle(new Request('http://localhost/records/2'))

    expect(keys).toHaveLength(2)
    expect(keys[0]).toBe(keys[1])
    expect(keys[0]).toContain('GET /records/:id')
    expect(keys[0]).not.toContain('/records/1')
  })

  it('различает пути', async () => {
    const { keys, limiter } = capturingLimiter()
    const app = createTestGateway({ rateLimit: limiter })

    await app.handle(new Request('http://localhost/records?page=1'))
    await app.handle(new Request('http://localhost/queue'))

    expect(keys).toHaveLength(2)
    expect(keys[0]).not.toBe(keys[1])
    expect(keys[0]).toContain('GET /records')
    expect(keys[1]).toContain('GET /queue')
  })

  it('игнорирует query-строку', async () => {
    const { keys, limiter } = capturingLimiter()
    const app = createTestGateway({ rateLimit: limiter })

    await app.handle(new Request('http://localhost/records?page=1&limit=10'))
    await app.handle(new Request('http://localhost/records?page=2&limit=10'))

    expect(keys[0]).toBe(keys[1])
  })

  it('берёт путь из ctx.route, а без него — pathname URL', async () => {
    const { keys, limiter } = capturingLimiter()
    const guard = rateLimitGuard(limiter)

    await guard({ request: new Request('http://localhost/ratings/42?x=1', { method: 'PUT' }) })
    await guard(
      {
        request: new Request('http://localhost/ratings/42', { method: 'PUT' }),
        route: '/ratings/:id',
      },
      RATE_LIMITS.like,
    )

    expect(keys[0]).toBe('rl:PUT /ratings/42:unknown')
    expect(keys[1]).toBe('rl:PUT /ratings/:id:unknown')

    // Тот же путь, другой метод — другой ключ.
    await guard({
      request: new Request('http://localhost/ratings/42', { method: 'DELETE' }),
      route: '/ratings/:id',
    })
    expect(keys[2]).toBe('rl:DELETE /ratings/:id:unknown')
    expect(keys[2]).not.toBe(keys[1])
  })
})
