import { describe, expect, it, mock } from 'bun:test'
import { createGateway } from '@/gateway'
import type { Authenticator, GatewayUser } from '@/gateway/auth'
import type { RateLimiter } from '@/gateway/rate-limit'

const USER: GatewayUser = {
  id: 'user-1',
  login: 'le-xot',
  role: 'ADMIN',
  profileImageUrl: 'https://example.com/avatar.png',
  color: '#22c55e',
  hasCustomAvatar: false,
  createdAt: '2026-01-01T00:00:00.000Z',
}

const authenticator = (user: GatewayUser | null): Authenticator => ({
  resolve: mock(async () => user),
})

const limiter = (allowed: boolean): RateLimiter => ({
  hit: mock(async () => ({ allowed, retryAfterSeconds: 12 })),
})

function gatewayWith({ user, allowed = true }: { user: GatewayUser | null; allowed?: boolean }) {
  const auth = authenticator(user)
  const rateLimit = limiter(allowed)

  const gateway = createGateway({
    weather: { getWeatherData: async () => null },
    auth,
    rateLimit,
  })

  return { gateway, auth, rateLimit }
}

async function call(gateway: ReturnType<typeof gatewayWith>['gateway'], cookie?: string) {
  const response = await gateway.handle(
    new Request('http://localhost/auth/me', {
      headers: cookie ? { cookie } : {},
    }),
  )

  return { status: response.status, headers: response.headers, body: await response.json() }
}

describe('GET /auth/me', () => {
  it('rejects a request without the token cookie', async () => {
    const { gateway } = gatewayWith({ user: USER })

    const { status, body } = await call(gateway)

    expect(status).toBe(401)
    expect(body).toEqual({
      statusCode: 401,
      message: 'Unauthorized',
      error: 'Unauthorized',
    })
  })

  it('returns the user behind a valid token', async () => {
    const { gateway, auth } = gatewayWith({ user: USER })

    const { status, body } = await call(gateway, 'token=valid-jwt')

    expect(status).toBe(200)
    expect(body).toEqual(USER)
    expect(auth.resolve).toHaveBeenCalledWith('valid-jwt')
  })

  it('rejects an unknown or expired token', async () => {
    const { gateway } = gatewayWith({ user: null })

    const { status, body } = await call(gateway, 'token=expired-jwt')

    expect(status).toBe(401)
    expect(body).toMatchObject({ statusCode: 401, message: 'Unauthorized' })
  })

  it('rate limits before checking auth', async () => {
    const { gateway, auth } = gatewayWith({ user: USER, allowed: false })

    const { status, headers, body } = await call(gateway)

    expect(status).toBe(429)
    expect(headers.get('retry-after')).toBe('12')
    expect(body).toEqual({
      statusCode: 429,
      message: 'Превышен лимит запросов',
      error: 'Too Many Requests',
    })
    expect(auth.resolve).not.toHaveBeenCalled()
  })
})
