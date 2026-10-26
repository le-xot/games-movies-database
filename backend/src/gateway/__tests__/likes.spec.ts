import { describe, expect, it, mock } from 'bun:test'
import { createTestGateway } from '@backend/__tests__/helpers/gateway-stub'
import type { GatewayUser } from '@backend/gateway/auth'
import type { LikesService } from '@backend/gateway/likes'

const USER: GatewayUser = {
  id: 'user-1',
  login: 'le-xot',
  role: 'USER',
  profileImageUrl: '',
  color: '#000000',
  hasCustomAvatar: false,
  avatarFrameId: null,
  activeBadgeId: null,
  createdAt: '2026-01-01T00:00:00.000Z',
}

const LIKE = {
  id: 'like-1',
  userId: USER.id,
  recordId: 7,
  createdAt: '2026-02-03T04:05:06.000Z',
}

function likesStub(overrides: Partial<LikesService> = {}): LikesService {
  return {
    createLike: mock(async () => LIKE),
    deleteLike: mock(async () => {}),
    getLikesByRecordId: mock(async () => ({ likes: [LIKE], total: 1 })),
    getLikesByUserId: mock(async () => ({ likes: [], total: 0 })),
    getLikes: mock(async () => ({ likes: [], total: 0 })),
    ...overrides,
  }
}

function build(options: { user?: GatewayUser | null; likes?: LikesService; allowed?: boolean }) {
  const likes = options.likes ?? likesStub()
  const gateway = createTestGateway({
    likes,
    auth: { resolve: async () => options.user ?? null },
    rateLimit: { hit: async () => ({ allowed: options.allowed ?? true, retryAfterSeconds: 5 }) },
  })

  return { gateway, likes }
}

function request(path: string, init: RequestInit = {}) {
  return new Request(`http://localhost${path}`, {
    ...init,
    headers: { cookie: 'token=valid-jwt', ...(init.headers ?? {}) },
  })
}

describe('likes routes', () => {
  it('rejects an anonymous like', async () => {
    const { gateway } = build({ user: null })

    const response = await gateway.handle(
      new Request('http://localhost/likes', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ recordId: 7 }),
      }),
    )

    expect(response.status).toBe(401)
  })

  it('creates a like for the current user', async () => {
    const { gateway, likes } = build({ user: USER })

    const response = await gateway.handle(
      request('/likes', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ recordId: 7 }),
      }),
    )

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual(LIKE)
    expect(likes.createLike).toHaveBeenCalledWith(USER.id, 7)
  })

  it('rejects a body without recordId', async () => {
    const { gateway } = build({ user: USER })

    const response = await gateway.handle(
      request('/likes', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      }),
    )

    expect(response.status).toBe(400)
  })

  it('deletes a like and answers with an empty body', async () => {
    const { gateway, likes } = build({ user: USER })

    const response = await gateway.handle(request('/likes/7', { method: 'DELETE' }))

    expect(response.status).toBe(200)
    expect(await response.text()).toBe('')
    expect(likes.deleteLike).toHaveBeenCalledWith(USER.id, 7)
  })

  it('rate limits writes before touching the domain', async () => {
    const { gateway, likes } = build({ user: USER, allowed: false })

    const response = await gateway.handle(request('/likes/7', { method: 'DELETE' }))

    expect(response.status).toBe(429)
    expect(response.headers.get('retry-after')).toBe('5')
    expect(likes.deleteLike).not.toHaveBeenCalled()
  })

  it('passes pagination through to the domain', async () => {
    const { gateway, likes } = build({ user: USER })

    const response = await gateway.handle(request('/likes/count?page=2&limit=5'))

    expect(response.status).toBe(200)
    expect(likes.getLikes).toHaveBeenCalledWith(2, 5)
  })

  it('returns likes of a record', async () => {
    const { gateway, likes } = build({ user: USER })

    const response = await gateway.handle(request('/likes/records/7'))

    expect(await response.json()).toEqual({ likes: [LIKE], total: 1 })
    expect(likes.getLikesByRecordId).toHaveBeenCalledWith(7)
  })
})
