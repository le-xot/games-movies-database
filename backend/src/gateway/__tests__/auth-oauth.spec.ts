import { describe, expect, it, mock } from 'bun:test'
import { createTestGateway } from '@backend/__tests__/helpers/gateway-stub'
import type { GatewayUser } from '@backend/gateway/auth'

const USER: GatewayUser = {
  id: 'user-1',
  login: 'le-xot',
  role: 'USER',
  profileImageUrl: '',
  color: '#000000',
  hasCustomAvatar: false,
  createdAt: '2026-01-01T00:00:00.000Z',
}

function build(options: { user?: GatewayUser | null; exchangeTwitch?: unknown } = {}) {
  const exchangeTwitch = options.exchangeTwitch ?? mock(async () => 'jwt-token')
  const gateway = createTestGateway({
    auth: { resolve: async () => options.user ?? null },
    oauth: {
      exchangeTwitch: exchangeTwitch as never,
      exchangeKick: async () => 'jwt-token',
      linkTwitch: async () => {},
      linkKick: async () => {},
      createTelegramRequest: () => ({
        url: 'https://oauth.telegram.org/auth?x=1',
        state: 'tg-state',
        codeVerifier: 'tg-verifier',
      }),
      exchangeTelegram: async () => ({
        id: '1',
        firstName: 'Lesha',
      }),
      loginTelegram: async () => 'jwt-token',
      linkTelegram: async () => {},
    },
  })

  return { gateway, exchangeTwitch }
}

function request(path: string, init: RequestInit = {}, cookie?: string) {
  return new Request(`http://localhost${path}`, {
    ...init,
    headers: { ...(cookie ? { cookie } : {}), ...(init.headers ?? {}) },
  })
}

describe('OAuth: twitch', () => {
  it('redirects to Twitch and stores the state cookie', async () => {
    const response = await build().gateway.handle(request('/auth/twitch'))

    expect(response.status).toBe(302)
    expect(response.headers.get('location')).toContain('id.twitch.tv/oauth2/authorize')
    expect(response.headers.get('location')).toContain('client_id=twitch-client')
    expect(response.headers.getSetCookie().join(';')).toContain('twitch_state=')
  })

  it('requires a session to start linking', async () => {
    const response = await build().gateway.handle(request('/auth/twitch/link'))

    expect(response.status).toBe(401)
  })

  it('marks the linking cookie when a session exists', async () => {
    const response = await build({ user: USER }).gateway.handle(
      request('/auth/twitch/link', {}, 'token=jwt'),
    )

    expect(response.status).toBe(302)
    expect(response.headers.getSetCookie().join(';')).toContain('twitch_linking=1')
  })

  it('rejects a callback with the wrong state', async () => {
    const response = await build().gateway.handle(
      request(
        '/auth/twitch/callback',
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ code: 'c', state: 'forged' }),
        },
        'twitch_state=real',
      ),
    )

    expect(response.status).toBe(400)
    // Одноразовый state гасится и при неудаче: иначе он переживает подбор.
    expect(response.headers.getSetCookie().join(';')).toContain('twitch_state=;')
  })

  it('answers the link callback with a JSON body', async () => {
    const { gateway } = build({ user: USER })

    const response = await gateway.handle(
      request(
        '/auth/twitch/link',
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ code: 'c', state: 'real' }),
        },
        'token=jwt; twitch_state=real',
      ),
    )

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ success: true })
  })

  it('exchanges the code and sets the session cookie', async () => {
    const { gateway, exchangeTwitch } = build()

    const response = await gateway.handle(
      request(
        '/auth/twitch/callback',
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ code: 'c', state: 'real' }),
        },
        'twitch_state=real',
      ),
    )

    expect(response.status).toBe(200)
    // Тело — JSON, а не текст: клиенты вроде openapi-fetch всегда парсят JSON
    // и падали с `SyntaxError` на строке `Authentication successful`.
    expect(response.headers.get('content-type')).toContain('application/json')
    expect(await response.json()).toEqual({ success: true })
    expect(response.headers.getSetCookie().join(';')).toContain('token=jwt-token')
    expect(exchangeTwitch).toHaveBeenCalledWith('c')
  })
})

describe('OAuth: kick', () => {
  it('redirects with PKCE challenge and verifier cookie', async () => {
    const response = await build().gateway.handle(request('/auth/kick'))

    expect(response.status).toBe(302)
    expect(response.headers.get('location')).toContain('code_challenge_method=S256')
    expect(response.headers.getSetCookie().join(';')).toContain('kick_code_verifier=')
    expect(response.headers.getSetCookie().join(';')).toContain('kick_state=')
  })

  it('rejects a callback without a code verifier', async () => {
    const response = await build().gateway.handle(
      request('/auth/kick/callback', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ code: 'c', state: 's' }),
      }),
    )

    expect(response.status).toBe(400)
  })
})

describe('OAuth: telegram', () => {
  it('redirects and stores the OIDC cookies', async () => {
    const response = await build().gateway.handle(request('/auth/telegram'))

    expect(response.status).toBe(302)
    expect(response.headers.get('location')).toBe('https://oauth.telegram.org/auth?x=1')
    expect(response.headers.getSetCookie().join(';')).toContain('tg_oidc_state=')
  })

  it('redirects back with an error instead of failing the page', async () => {
    const response = await build().gateway.handle(
      request('/auth/telegram/oidc/callback?error=access_denied'),
    )

    expect(response.status).toBe(302)
    expect(response.headers.get('location')).toContain('mode=login')
    expect(response.headers.get('location')).toContain('error=')
  })

  it('logs in by exchanging the code', async () => {
    const response = await build().gateway.handle(
      request(
        '/auth/telegram/oidc/callback?code=c&state=st',
        {},
        'tg_oidc_state=st; tg_oidc_verifier=v',
      ),
    )

    expect(response.status).toBe(302)
    expect(response.headers.get('location')).toContain('mode=login')
    expect(response.headers.getSetCookie().join(';')).toContain('token=jwt-token')
  })
})
