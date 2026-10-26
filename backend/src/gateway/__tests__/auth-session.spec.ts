import { describe, expect, it, mock } from 'bun:test'
import { createTestGateway } from '@backend/__tests__/helpers/gateway-stub'
import { ForbiddenException } from '@backend/utils/errors'
import type { GatewayUser } from '@backend/gateway/auth'
import type { AuthSessionPort } from '@backend/gateway/auth-session'

const USER: GatewayUser = {
  id: 'user-1',
  login: 'le-xot',
  role: 'USER',
  profileImageUrl: '',
  color: '#000000',
  hasCustomAvatar: false,
  avatarFrameId: null,
  createdAt: '2026-01-01T00:00:00.000Z',
}

function sessionStub(overrides: Partial<AuthSessionPort> = {}): AuthSessionPort {
  return {
    getAccounts: mock(async () => []),
    unlinkAccount: mock(async () => {}),
    updateLogin: mock(async () => USER),
    getCustomization: mock(async () => ({
      avatarFrameId: null,
      unlockedAvatarFrameIds: [],
    })),
    updateCustomization: mock(async () => USER),
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

  describe('customization', () => {
    function patchCustomization(payload: unknown, cookie = true) {
      return request(
        '/auth/me/customization',
        {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload),
        },
        cookie,
      )
    }

    it('returns the selected and unlocked cosmetics', async () => {
      const { gateway, authSession } = build({
        user: USER,
        session: sessionStub({
          getCustomization: mock(async () => ({
            avatarFrameId: 'admin',
            unlockedAvatarFrameIds: ['admin'],
          })),
        }),
      })

      const response = await gateway.handle(request('/auth/me/customization'))

      expect(response.status).toBe(200)
      expect(await response.json()).toEqual({
        avatarFrameId: 'admin',
        unlockedAvatarFrameIds: ['admin'],
      })
      expect(authSession.getCustomization).toHaveBeenCalledWith(USER.id)
    })

    it('requires a session for the customization state', async () => {
      const response = await build().gateway.handle(request('/auth/me/customization', {}, false))

      expect(response.status).toBe(401)
    })

    it('saves a frame and a badge from the catalog', async () => {
      const { gateway, authSession } = build({ user: USER })

      const response = await gateway.handle(
        patchCustomization({ avatarFrameId: 'admin', activeBadgeId: 'cinema-buff' }),
      )

      expect(response.status).toBe(200)
      expect(authSession.updateCustomization).toHaveBeenCalledWith(USER.id, {
        avatarFrameId: 'admin',
      })
    })

    it('resets the frame and the badge with null', async () => {
      const { gateway, authSession } = build({ user: USER })

      const response = await gateway.handle(
        patchCustomization({ avatarFrameId: null, activeBadgeId: null }),
      )

      expect(response.status).toBe(200)
      expect(authSession.updateCustomization).toHaveBeenCalledWith(USER.id, {
        avatarFrameId: null,
      })
    })

    it('leaves omitted fields untouched', async () => {
      const { gateway, authSession } = build({ user: USER })

      const response = await gateway.handle(patchCustomization({ activeBadgeId: 'night-owl' }))

      expect(response.status).toBe(200)
      expect(authSession.updateCustomization).toHaveBeenCalledWith(USER.id, {
        avatarFrameId: undefined,
      })
    })

    it('rejects an unknown frame and does not touch the domain', async () => {
      const { gateway, authSession } = build({ user: USER })

      const response = await gateway.handle(patchCustomization({ avatarFrameId: 'diamond' }))

      expect(response.status).toBe(400)
      expect(authSession.updateCustomization).not.toHaveBeenCalled()
    })

    it('answers 403 when the frame is not unlocked yet', async () => {
      const { gateway } = build({
        user: USER,
        session: sessionStub({
          updateCustomization: mock(async () => {
            throw new ForbiddenException('Рамка ещё не открыта')
          }),
        }),
      })

      const response = await gateway.handle(patchCustomization({ avatarFrameId: 'wordle-streak' }))

      expect(response.status).toBe(403)
    })

    it('requires a session', async () => {
      const { gateway, authSession } = build()

      const response = await gateway.handle(patchCustomization({ avatarFrameId: 'admin' }, false))

      expect(response.status).toBe(401)
      expect(authSession.updateCustomization).not.toHaveBeenCalled()
    })
  })
})
