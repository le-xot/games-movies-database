import { describe, expect, it, mock } from 'bun:test'
import { createTestGateway } from '@backend/__tests__/helpers/gateway-stub'
import type { GatewayUser } from '@backend/gateway/auth'
import type { AuthSessionPort } from '@backend/gateway/auth-session'

const USER: GatewayUser = {
  id: 'user-1',
  login: 'le-xot',
  role: 'USER',
  profileImageUrl: '',
  color: '#000000',
  hasCustomAvatar: false,
  createdAt: '2026-01-01T00:00:00.000Z',
}

function sessionStub(overrides: Partial<AuthSessionPort> = {}): AuthSessionPort {
  return {
    getAccounts: mock(async () => []),
    unlinkAccount: mock(async () => {}),
    updateLogin: mock(async () => USER),
    deleteUser: mock(async () => {}),
    uploadAvatar: mock(async () => USER),
    deleteAvatar: mock(async () => USER),
    ...overrides,
  }
}

function build(options: { user?: GatewayUser | null; session?: AuthSessionPort } = {}) {
  const authSession = options.session ?? sessionStub()
  const gateway = createTestGateway({
    authSession,
    auth: { resolve: async () => options.user ?? null },
  })

  return { gateway, authSession }
}

function request(path: string, init: RequestInit = {}, cookie = true) {
  return new Request(`http://localhost${path}`, {
    ...init,
    headers: { ...(cookie ? { cookie: 'token=jwt' } : {}), ...(init.headers ?? {}) },
  })
}

describe('auth session', () => {
  it('clears the token cookie on logout and answers 200', async () => {
    const response = await build().gateway.handle(
      request('/auth/logout', { method: 'POST' }, false),
    )

    expect(response.status).toBe(200)
    expect(response.headers.get('set-cookie')).toContain('token=;')
  })

  it('deletes the account and clears the cookie', async () => {
    const { gateway, authSession } = build({ user: USER })

    const response = await gateway.handle(request('/auth/me', { method: 'DELETE' }))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ success: true })
    expect(response.headers.get('set-cookie')).toContain('token=;')
    expect(authSession.deleteUser).toHaveBeenCalledWith(USER.id)
  })

  it('rejects an unknown platform', async () => {
    const { gateway, authSession } = build({ user: USER })

    const response = await gateway.handle(request('/auth/accounts/STEAM', { method: 'DELETE' }))

    expect(response.status).toBe(400)
    expect(authSession.unlinkAccount).not.toHaveBeenCalled()
  })

  it('unlinks a known platform', async () => {
    const { gateway, authSession } = build({ user: USER })

    const response = await gateway.handle(request('/auth/accounts/TWITCH', { method: 'DELETE' }))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ success: true })
    expect(authSession.unlinkAccount).toHaveBeenCalledWith(USER.id, 'TWITCH')
  })

  it('updates the nickname', async () => {
    const { gateway, authSession } = build({ user: USER })

    const response = await gateway.handle(
      request('/auth/me', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ login: 'new-name' }),
      }),
    )

    expect(response.status).toBe(200)
    expect(authSession.updateLogin).toHaveBeenCalledWith(USER.id, 'new-name')
  })

  it('rejects an avatar upload without a file', async () => {
    const { gateway } = build({ user: USER })

    const form = new FormData()
    const response = await gateway.handle(
      request('/auth/me/avatar', { method: 'POST', body: form }),
    )

    expect(response.status).toBe(400)
  })

  it('rejects a non-image avatar', async () => {
    const { gateway, authSession } = build({ user: USER })

    const form = new FormData()
    form.set('file', new File(['hello'], 'note.txt', { type: 'text/plain' }))

    const response = await gateway.handle(
      request('/auth/me/avatar', { method: 'POST', body: form }),
    )

    expect(response.status).toBe(400)
    expect(authSession.uploadAvatar).not.toHaveBeenCalled()
  })

  it('uploads an image avatar', async () => {
    const { gateway, authSession } = build({ user: USER })

    const form = new FormData()
    form.set('file', new File([new Uint8Array([1, 2, 3])], 'a.png', { type: 'image/png' }))

    const response = await gateway.handle(
      request('/auth/me/avatar', { method: 'POST', body: form }),
    )

    expect(response.status).toBe(200)
    expect(authSession.uploadAvatar).toHaveBeenCalledWith(USER.id, expect.any(Buffer))
  })

  it('requires a session for account listing', async () => {
    const response = await build().gateway.handle(request('/auth/accounts', {}, false))

    expect(response.status).toBe(401)
  })
})
