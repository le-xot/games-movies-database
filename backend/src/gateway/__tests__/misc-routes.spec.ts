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
  return createTestGateway({
    auth: { resolve: async () => user },
    ...overrides,
  })
}

function request(path: string, init: RequestInit = {}, cookie = true) {
  return new Request(`http://localhost${path}`, {
    ...init,
    headers: { ...(cookie ? { cookie: 'token=jwt' } : {}), ...(init.headers ?? {}) },
  })
}

describe('health', () => {
  it('reports ok without auth', async () => {
    const response = await build(null).handle(request('/health', {}, false))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ status: 'ok' })
  })
})

describe('users', () => {
  it('returns 404 for an unknown user', async () => {
    const response = await build(ADMIN).handle(request('/users/missing'))

    expect(response.status).toBe(404)
    expect(await response.json()).toMatchObject({ statusCode: 404 })
  })

  it('forbids a non-admin from merging users', async () => {
    const response = await build(USER).handle(
      request('/users/a/merge', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sourceUserId: 'b' }),
      }),
    )

    expect(response.status).toBe(403)
  })

  it('merges users for an admin and answers 201', async () => {
    const merge = mock(async () => ({
      accountsMoved: 1,
      accountsDropped: 0,
      likesMoved: 0,
      likesDropped: 0,
      ratingsMoved: 0,
      ratingsDropped: 0,
      suggestionsMoved: 0,
      wordleGamesMoved: 0,
      wordleGamesDropped: 0,
    }))
    const gateway = createTestGateway({
      auth: { resolve: async () => ADMIN },
      users: {
        getAll: async () => [],
        getById: async () => null,
        getAccounts: async () => [],
        remove: async () => {},
        merge: merge as never,
      },
    })

    const response = await gateway.handle(
      request('/users/a/merge', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sourceUserId: 'b' }),
      }),
    )

    expect(response.status).toBe(201)
    expect(merge).toHaveBeenCalledWith('a', 'b')
  })
})

describe('limits', () => {
  it('forbids a non-admin', async () => {
    const response = await build(USER).handle(
      request('/limits', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'SUGGESTION', quantity: 5 }),
      }),
    )

    expect(response.status).toBe(403)
  })

  it('updates the limit for an admin', async () => {
    const change = mock(async (input: { name: string; quantity: number }) => input)
    const gateway = createTestGateway({
      auth: { resolve: async () => ADMIN },
      limits: { change: change as never },
    })

    const response = await gateway.handle(
      request('/limits', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'SUGGESTION', quantity: 5 }),
      }),
    )

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ name: 'SUGGESTION', quantity: 5 })
    expect(change).toHaveBeenCalledWith({ name: 'SUGGESTION', quantity: 5 })
  })
})

describe('twir', () => {
  const body = JSON.stringify({ userId: 'u1', link: 'https://example.com' })

  it('rejects a request without the api key', async () => {
    const gateway = createTestGateway({ twirApiKey: 'secret' })

    const response = await gateway.handle(
      request('/twir/suggestion', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body,
      }),
    )

    expect(response.status).toBe(401)
  })

  it('accepts a request with the right api key', async () => {
    const gateway = createTestGateway({
      twirApiKey: 'secret',
      twir: { createSuggestion: async () => ({ title: 'Paprika', genre: 'ANIME' }) },
    })

    const response = await gateway.handle(
      request('/twir/suggestion', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-api-key': 'secret' },
        body,
      }),
    )

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ title: 'Paprika', genre: 'ANIME' })
  })

  it('rejects a link that is not an absolute http(s) url', async () => {
    const gateway = createTestGateway({ twirApiKey: 'secret' })

    for (const link of ['notaurl', 'javascript:alert(1)', 'https://nodot']) {
      const response = await gateway.handle(
        request('/twir/suggestion', {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-api-key': 'secret' },
          body: JSON.stringify({ userId: 'u1', link }),
        }),
      )

      expect(response.status).toBe(400)
    }
  })

  it('rejects everything when the key is not configured', async () => {
    const gateway = createTestGateway({ twirApiKey: undefined })

    const response = await gateway.handle(
      request('/twir/suggestion', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-api-key': '' },
        body,
      }),
    )

    expect(response.status).toBe(401)
  })
})

describe('suggestions', () => {
  it('creates a suggestion for a regular user', async () => {
    const create = mock(async () => ({ title: 'Paprika', genre: 'ANIME' as const }))
    const gateway = createTestGateway({
      auth: { resolve: async () => USER },
      suggestions: {
        list: async () => [],
        create: create as never,
        remove: async () => {},
      },
    })

    const response = await gateway.handle(
      request('/suggestions', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ link: 'https://example.com' }),
      }),
    )

    expect(response.status).toBe(200)
    expect(create).toHaveBeenCalledWith({ link: 'https://example.com', userId: USER.id })
  })

  it('rejects deleting a suggestion without a session', async () => {
    const response = await build(null).handle(
      request('/suggestions/1', { method: 'DELETE' }, false),
    )

    expect(response.status).toBe(401)
  })
})
