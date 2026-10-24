import { describe, expect, it, mock } from 'bun:test'
import { createTestGateway } from '@/__tests__/helpers/gateway-stub'
import type { GatewayUser } from '@/gateway/auth'
import type { RecordsService } from '@/gateway/records'

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

const RECORD = {
  id: 1,
  title: 'Doom',
  link: 'https://example.com/doom',
  posterUrl: '',
  status: null,
  type: null,
  genre: null,
  grade: null,
  episode: null,
  createdAt: '2026-01-01T00:00:00.000Z',
}

function recordsStub(overrides: Partial<RecordsService> = {}): RecordsService {
  return {
    createFromLink: mock(async () => RECORD),
    findById: mock(async () => RECORD),
    patch: mock(async () => RECORD),
    updatePoster: mock(async () => RECORD),
    remove: mock(async () => {}),
    getAll: mock(async () => ({ records: [RECORD], total: 1 })),
    ...overrides,
  }
}

function build(options: { user?: GatewayUser | null; records?: RecordsService } = {}) {
  const records = options.records ?? recordsStub()
  const gateway = createTestGateway({
    records,
    auth: { resolve: async () => options.user ?? null },
  })

  return { gateway, records }
}

function request(path: string, init: RequestInit = {}, cookie = true) {
  return new Request(`http://localhost${path}`, {
    ...init,
    headers: { ...(cookie ? { cookie: 'token=valid-jwt' } : {}), ...(init.headers ?? {}) },
  })
}

describe('records routes', () => {
  it('serves the list to guests without a viewer', async () => {
    const { gateway, records } = build()

    const response = await gateway.handle(request('/records', {}, false))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ records: [RECORD], total: 1 })
    expect(records.getAll).toHaveBeenCalledWith(expect.objectContaining({ viewerId: undefined }))
  })

  it('passes the viewer id when a cookie is present', async () => {
    const { gateway, records } = build({ user: USER })

    await gateway.handle(request('/records'))

    expect(records.getAll).toHaveBeenCalledWith(expect.objectContaining({ viewerId: USER.id }))
  })

  it('keeps every repeated status filter', async () => {
    const { gateway, records } = build()

    await gateway.handle(request('/records?status=QUEUE&status=DONE'))

    expect(records.getAll).toHaveBeenCalledWith(
      expect.objectContaining({ status: ['QUEUE', 'DONE'] }),
    )
  })

  it('wraps a single status filter into an array', async () => {
    const { gateway, records } = build()

    await gateway.handle(request('/records?status=QUEUE'))

    expect(records.getAll).toHaveBeenCalledWith(expect.objectContaining({ status: ['QUEUE'] }))
  })

  it('forbids a non-admin to create a record', async () => {
    const { gateway, records } = build({ user: USER })

    const response = await gateway.handle(
      request('/records/link', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ link: 'https://example.com/doom' }),
      }),
    )

    expect(response.status).toBe(403)
    expect(records.createFromLink).not.toHaveBeenCalled()
  })

  it('creates a record for an admin', async () => {
    const { gateway, records } = build({ user: ADMIN })

    const response = await gateway.handle(
      request('/records/link', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ link: 'https://example.com/doom' }),
      }),
    )

    expect(response.status).toBe(201)
    expect(records.createFromLink).toHaveBeenCalledWith({ link: 'https://example.com/doom' })
  })

  it('deletes a record with 204 and no body', async () => {
    const { gateway, records } = build({ user: ADMIN })

    const response = await gateway.handle(request('/records/1', { method: 'DELETE' }))

    expect(response.status).toBe(204)
    expect(await response.text()).toBe('')
    expect(records.remove).toHaveBeenCalledWith(1)
  })
})

describe('ratings friends', () => {
  it('returns members without auth and without touching the record service', async () => {
    const gateway = createTestGateway({
      ratings: {
        rate: async () => {
          throw new Error('rate не заглушен')
        },
        unrate: async () => {},
        getMy: async () => ({ items: [], total: 0 }),
        getUser: async () => ({ items: [], total: 0 }),
        getFriends: async () => ({
          members: [
            {
              userId: 'u1',
              login: 'friend',
              profileImageUrl: '',
              counts: { LIKE: 2 },
              total: 2,
            },
          ],
        }),
      },
    })

    const response = await gateway.handle(new Request('http://localhost/ratings/friends'))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      members: [
        { userId: 'u1', login: 'friend', profileImageUrl: '', counts: { LIKE: 2 }, total: 2 },
      ],
    })
  })
})
