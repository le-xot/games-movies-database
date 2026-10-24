import { describe, expect, it } from 'bun:test'
import { createGateway } from '@/gateway'
import { createHttpServer } from '@/server/http'

const ALLOWED_ORIGIN = 'https://le-xot.dev'
const CORS_ORIGINS = [ALLOWED_ORIGIN, 'http://localhost:5173']

function server() {
  return createHttpServer(
    createGateway({
      weather: { getWeatherData: async () => null },
      auth: { resolve: async () => null },
      rateLimit: { hit: async () => ({ allowed: true, retryAfterSeconds: 0 }) },
    }),
    { corsOrigins: CORS_ORIGINS, production: true },
  )
}

async function get(path: string, headers: Record<string, string> = {}) {
  return await server().handle(new Request(`http://localhost${path}`, { headers }))
}

describe('HTTP layer', () => {
  it('serves gateway routes under /api', async () => {
    const response = await get('/api/auth/me')

    expect(response.status).toBe(401)
    expect(await response.json()).toMatchObject({ statusCode: 401 })
  })

  it('does not expose gateway routes outside /api', async () => {
    const response = await get('/auth/me')

    expect(response.status).toBe(404)
  })

  it('sets security headers on every response', async () => {
    const response = await get('/api/auth/me')

    expect(response.headers.get('x-content-type-options')).toBe('nosniff')
    expect(response.headers.get('x-frame-options')).toBe('DENY')
    expect(response.headers.get('referrer-policy')).toBe('strict-origin-when-cross-origin')
    expect(response.headers.get('cross-origin-opener-policy')).toBe('same-origin')
    expect(response.headers.get('content-security-policy')).toContain("default-src 'self'")
  })

  it('omits CSP outside production', async () => {
    const app = createHttpServer(
      createGateway({
        weather: { getWeatherData: async () => null },
        auth: { resolve: async () => null },
        rateLimit: { hit: async () => ({ allowed: true, retryAfterSeconds: 0 }) },
      }),
      { corsOrigins: CORS_ORIGINS, production: false },
    )

    const response = await app.handle(new Request('http://localhost/api/auth/me'))

    expect(response.headers.get('content-security-policy')).toBeNull()
    expect(response.headers.get('x-frame-options')).toBe('DENY')
  })

  it('allows a configured origin with credentials', async () => {
    const response = await get('/api/auth/me', { origin: ALLOWED_ORIGIN })

    expect(response.headers.get('access-control-allow-origin')).toBe(ALLOWED_ORIGIN)
    expect(response.headers.get('access-control-allow-credentials')).toBe('true')
  })

  it('does not allow an unknown origin', async () => {
    const response = await get('/api/auth/me', { origin: 'https://evil.example' })

    expect(response.headers.get('access-control-allow-origin')).toBeNull()
  })

  it('answers preflight requests', async () => {
    const response = await server().handle(
      new Request('http://localhost/api/auth/me', {
        method: 'OPTIONS',
        headers: {
          origin: ALLOWED_ORIGIN,
          'access-control-request-method': 'GET',
          'access-control-request-headers': 'content-type',
        },
      }),
    )

    expect(response.status).toBe(204)
    expect(response.headers.get('access-control-allow-origin')).toBe(ALLOWED_ORIGIN)
    expect(response.headers.get('access-control-allow-methods')).toContain('GET')
    expect(response.headers.get('access-control-allow-headers')).toContain('content-type')
    expect(response.headers.get('access-control-max-age')).toBe('600')
  })
})
