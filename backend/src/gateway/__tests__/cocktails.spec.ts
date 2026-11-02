import { describe, expect, it, mock } from 'bun:test'
import { createTestGateway } from '@backend/__tests__/helpers/gateway-stub'
import type { GatewayUser } from '@backend/gateway/auth'
import type { CocktailsPort } from '@backend/gateway/cocktails'
import type { CocktailCatalog } from '@backend/modules/cocktail/cocktail.service'
import type { MatchedCocktail } from '@backend/modules/cocktail/cocktail.types'

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

const CATALOG: CocktailCatalog = {
  shelves: [
    {
      id: 'SPIRIT',
      title: 'Крепкий алкоголь',
      ingredients: [{ id: 'gin', name: 'Джин' }],
    },
  ],
}

const MATCHED: MatchedCocktail[] = [
  {
    id: 'negroni',
    name: 'Негрони',
    method: 'STIR',
    glass: 'рокс',
    garnish: 'апельсиновая цедра',
    note: null,
    sourceName: 'IBA',
    sourceUrl: null,
    ingredients: [{ id: 'gin', name: 'Джин', amount: '30 мл', tier: 'CORE', present: true }],
    missingCore: [],
    missingExtra: [],
  },
]

function build(options: { user?: GatewayUser | null } = {}) {
  const getCatalog = mock(async () => CATALOG)
  const match = mock(async () => MATCHED)
  const getBar = mock(async () => ({ ingredientIds: ['gin'] }))
  const setBar = mock(async (_userId: string, ingredientIds: string[]) => ({ ingredientIds }))

  const gateway = createTestGateway({
    auth: { resolve: async () => options.user ?? null },
    cocktails: {
      getCatalog,
      match,
      getBar,
      setBar: setBar as CocktailsPort['setBar'],
    },
  })

  return { gateway, getCatalog, match, getBar, setBar }
}

function request(path: string, init: RequestInit = {}, cookie = true) {
  return new Request(`http://localhost${path}`, {
    ...init,
    headers: { ...(cookie ? { cookie: 'token=jwt' } : {}), ...(init.headers ?? {}) },
  })
}

function jsonRequest(path: string, method: string, body: unknown, cookie = true) {
  return request(
    path,
    {
      method,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    },
    cookie,
  )
}

describe('cocktails', () => {
  it('serves the public catalog with shelves and ingredients', async () => {
    const { gateway, getCatalog } = build()

    const response = await gateway.handle(request('/cocktails/catalog', {}, false))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual(CATALOG)
    expect(getCatalog).toHaveBeenCalledTimes(1)
  })

  it('passes the bar and the threshold to the matcher', async () => {
    const { gateway, match } = build()

    const response = await gateway.handle(
      jsonRequest('/cocktails/match', 'POST', { ingredientIds: ['gin'], maxMissing: 1 }, false),
    )

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual(MATCHED)
    expect(match).toHaveBeenCalledWith({ ingredientIds: ['gin'], maxMissing: 1 })
  })

  it('accepts the catalog-wide threshold used by search', async () => {
    const { gateway, match } = build()

    const response = await gateway.handle(
      jsonRequest('/cocktails/match', 'POST', { ingredientIds: ['gin'], maxMissing: 50 }, false),
    )

    expect(response.status).toBe(200)
    expect(match).toHaveBeenCalledWith({ ingredientIds: ['gin'], maxMissing: 50 })
  })

  it('rejects a threshold outside 0..50', async () => {
    const { gateway, match } = build()

    const response = await gateway.handle(
      jsonRequest('/cocktails/match', 'POST', { ingredientIds: ['gin'], maxMissing: 51 }, false),
    )

    expect(response.status).toBe(400)
    expect(match).not.toHaveBeenCalled()
  })

  it('rejects reading the bar without a session', async () => {
    const response = await build().gateway.handle(request('/cocktails/bar', {}, false))

    expect(response.status).toBe(401)
  })

  it('rejects writing the bar without a session', async () => {
    const response = await build().gateway.handle(
      jsonRequest('/cocktails/bar', 'PUT', { ingredientIds: ['gin'] }, false),
    )

    expect(response.status).toBe(401)
  })

  it('replaces the bar of the authenticated user', async () => {
    const { gateway, setBar } = build({ user: USER })

    const response = await gateway.handle(
      jsonRequest('/cocktails/bar', 'PUT', { ingredientIds: ['gin', 'tonic'] }),
    )

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ ingredientIds: ['gin', 'tonic'] })
    expect(setBar).toHaveBeenCalledWith(USER.id, ['gin', 'tonic'])
  })

  it('returns the bar of the authenticated user', async () => {
    const { gateway, getBar } = build({ user: USER })

    const response = await gateway.handle(request('/cocktails/bar'))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ ingredientIds: ['gin'] })
    expect(getBar).toHaveBeenCalledWith(USER.id)
  })
})
