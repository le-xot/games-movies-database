import { describe, expect, it, mock } from 'bun:test'
import { ExecutionContext, HttpException } from '@nestjs/common'
import { RATE_LIMIT_METADATA_KEY } from '../rate-limit.constants'
import { RateLimitGuard } from '../rate-limit.guard'
import { RateLimitService } from '../rate-limit.service'

const makeClient = (result: unknown) => ({ send: mock(() => Promise.resolve(result)) })

describe('RateLimitService', () => {
  const config = { limit: 5, ttl: 60_000 }

  it('allows requests under the limit', async () => {
    const client = makeClient([3, 45_000])
    const service = new RateLimitService(client as any)

    const result = await service.hit('rl:test:1.2.3.4', config)

    expect(result.allowed).toBe(true)
    expect(client.send).toHaveBeenCalledWith('EVAL', [
      expect.any(String),
      '1',
      'rl:test:1.2.3.4',
      '5',
      '60000',
    ])
  })

  it('blocks requests over the limit with retry-after', async () => {
    const service = new RateLimitService(makeClient([6, 30_000]) as any)

    const result = await service.hit('rl:test:1.2.3.4', config)

    expect(result.allowed).toBe(false)
    expect(result.retryAfterSeconds).toBe(30)
  })

  it('fails open when redis is unavailable', async () => {
    const client = { send: mock(() => Promise.reject(new Error('connection refused'))) }
    const service = new RateLimitService(client as any)

    const result = await service.hit('rl:test:1.2.3.4', config)

    expect(result.allowed).toBe(true)
  })
})

describe('RateLimitGuard', () => {
  const makeContext = (
    request: Record<string, unknown>,
    handler: Function,
    ControllerClass: { name: string },
    response: Record<string, unknown> = {},
  ) =>
    ({
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => response,
      }),
      getHandler: () => handler,
      getClass: () => ControllerClass,
    }) as unknown as ExecutionContext

  const makeService = (result: { allowed: boolean; retryAfterSeconds: number }) => ({
    hit: mock(() => Promise.resolve(result)),
  })

  it('uses the public preset when no decorator metadata is set', async () => {
    const service = makeService({ allowed: true, retryAfterSeconds: 0 })
    const guard = new RateLimitGuard(service as any)
    const handler = function publicHandler() {}

    const allowed = await guard.canActivate(
      makeContext({ ip: '1.1.1.1' }, handler, { name: 'Ctrl' }),
    )

    expect(allowed).toBe(true)
    expect(service.hit).toHaveBeenCalledWith('rl:Ctrl.publicHandler:1.1.1.1', {
      ttl: 60_000,
      limit: 1000,
    })
  })

  it('uses the decorator config when present', async () => {
    const service = makeService({ allowed: true, retryAfterSeconds: 0 })
    const guard = new RateLimitGuard(service as any)
    const handler = function loginHandler() {}
    Reflect.defineMetadata(RATE_LIMIT_METADATA_KEY, { ttl: 60_000, limit: 5 }, handler)

    await guard.canActivate(makeContext({ ip: '1.1.1.1' }, handler, { name: 'AuthCtrl' }))

    expect(service.hit).toHaveBeenCalledWith('rl:AuthCtrl.loginHandler:1.1.1.1', {
      ttl: 60_000,
      limit: 5,
    })
  })

  it('tracks clients by the first X-Forwarded-For hop', async () => {
    const service = makeService({ allowed: true, retryAfterSeconds: 0 })
    const guard = new RateLimitGuard(service as any)
    const handler = function publicHandler() {}
    const request = { headers: { 'x-forwarded-for': '203.0.113.7, 10.0.0.1' }, ip: '127.0.0.1' }

    await guard.canActivate(makeContext(request, handler, { name: 'Ctrl' }))

    expect(service.hit).toHaveBeenCalledWith('rl:Ctrl.publicHandler:203.0.113.7', {
      ttl: 60_000,
      limit: 1000,
    })
  })

  it('falls back to request.ip when X-Forwarded-For is missing', async () => {
    const service = makeService({ allowed: true, retryAfterSeconds: 0 })
    const guard = new RateLimitGuard(service as any)
    const handler = function publicHandler() {}

    await guard.canActivate(makeContext({ ip: '192.168.1.5' }, handler, { name: 'Ctrl' }))

    expect(service.hit).toHaveBeenCalledWith('rl:Ctrl.publicHandler:192.168.1.5', {
      ttl: 60_000,
      limit: 1000,
    })
  })

  it('throws 429 with Retry-After header when blocked', async () => {
    const service = makeService({ allowed: false, retryAfterSeconds: 42 })
    const guard = new RateLimitGuard(service as any)
    const handler = function publicHandler() {}
    const response = { setHeader: mock(() => {}) }

    await expect(
      guard.canActivate(makeContext({ ip: '1.1.1.1' }, handler, { name: 'Ctrl' }, response)),
    ).rejects.toThrow(HttpException)

    expect(response.setHeader).toHaveBeenCalledWith('Retry-After', '42')
  })
})
