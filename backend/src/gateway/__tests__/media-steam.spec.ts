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

const ADMIN: GatewayUser = { ...USER, role: 'ADMIN' }

function build(user: GatewayUser | null, overrides = {}) {
  return createTestGateway({ auth: { resolve: async () => user }, ...overrides })
}

function request(path: string, init: RequestInit = {}, cookie = true) {
  return new Request(`http://localhost${path}`, {
    ...init,
    headers: { ...(cookie ? { cookie: 'token=jwt' } : {}), ...(init.headers ?? {}) },
  })
}

describe('image proxy', () => {
  it('returns an immutable cached image with an ETag', async () => {
    const getImage = mock(async () => ({
      buffer: new Uint8Array([1, 2, 3]),
      contentType: 'image/webp',
    }))
    const gateway = build(null, { images: { getImage } })

    const response = await gateway.handle(request('/img?urlEncoded=abc', {}, false))

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('image/webp')
    expect(response.headers.get('cache-control')).toBe('public, max-age=31536000, immutable')
    expect(response.headers.get('etag')).toMatch(/^"[0-9a-f]{64}"$/)
    expect(getImage).toHaveBeenCalledWith('abc', 'poster')
  })

  it('passes the variant through', async () => {
    const getImage = mock(async () => ({ buffer: new Uint8Array(), contentType: 'image/webp' }))
    const gateway = build(null, { images: { getImage } })

    await gateway.handle(request('/img?urlEncoded=abc&variant=avatar', {}, false))

    expect(getImage).toHaveBeenCalledWith('abc', 'avatar')
  })

  it('rejects a request without urlEncoded', async () => {
    const response = await build(null).handle(request('/img', {}, false))

    expect(response.status).toBe(400)
  })
})

describe('avatar', () => {
  it('returns 404 when the user has no avatar', async () => {
    const response = await build(null).handle(request('/avatar/user-1', {}, false))

    expect(response.status).toBe(404)
    // Схема обещает `ApiErrorDto`, значит тело, а не пустой ответ.
    expect(await response.json()).toMatchObject({ statusCode: 404 })
  })

  it('serves the avatar with a short cache', async () => {
    const gateway = build(null, {
      avatars: { getAvatar: async () => new Uint8Array([9, 9]) },
    })

    const response = await gateway.handle(request('/avatar/user-1', {}, false))

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('image/webp')
    expect(response.headers.get('cache-control')).toBe('public, max-age=86400')
  })
})

describe('steam', () => {
  it('forbids a non-admin', async () => {
    const response = await build(USER).handle(request('/steam/games'))

    expect(response.status).toBe(403)
  })

  it('returns owned games for an admin', async () => {
    const gateway = build(ADMIN, {
      steam: {
        getGames: async () => ({
          games: [
            {
              appid: 1,
              name: 'Doom',
              img_icon_url: '',
              header_image: '',
              playtime_forever: 10,
            },
          ],
          existingAppIds: ['1'],
        }),
        importGames: async () => ({ created: [], failed: [] }),
      },
    })

    const response = await gateway.handle(request('/steam/games'))

    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({ existingAppIds: ['1'] })
  })

  it('imports games with 201', async () => {
    const importGames = mock(async () => ({ created: [], failed: [{ appId: 2, reason: 'x' }] }))
    const gateway = build(ADMIN, {
      steam: {
        getGames: async () => ({ games: [], existingAppIds: [] }),
        importGames,
      },
    })

    const response = await gateway.handle(
      request('/steam/import', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ games: [{ appId: 2, status: 'QUEUE' }] }),
      }),
    )

    expect(response.status).toBe(201)
    expect(importGames).toHaveBeenCalledWith([{ appId: 2, status: 'QUEUE' }], ADMIN.id)
  })

  it('rejects a fractional app id instead of passing it to the database', async () => {
    const importGames = mock(async () => ({ created: [], failed: [] }))
    const gateway = build(ADMIN, {
      steam: {
        getGames: async () => ({ games: [], existingAppIds: [] }),
        importGames,
      },
    })

    const response = await gateway.handle(
      request('/steam/import', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ games: [{ appId: 1.5, status: 'QUEUE' }] }),
      }),
    )

    expect(response.status).toBe(400)
    expect(importGames).not.toHaveBeenCalled()
  })
})
