import { describe, expect, it } from 'bun:test'
import { toGatewayLike, toGatewayUser } from '@backend/server/adapters'

const createdAt = new Date('2026-02-03T04:05:06.000Z')

const user = {
  id: 'user-1',
  login: 'le-xot',
  role: 'USER' as const,
  profileImageUrl: 'https://example.com/a.png',
  color: '#000000',
  hasCustomAvatar: false,
  createdAt,
}

describe('adapters', () => {
  it('serializes user dates for the HTTP layer', () => {
    expect(toGatewayUser(user)).toEqual({
      ...user,
      createdAt: '2026-02-03T04:05:06.000Z',
    })
  })

  it('serializes like dates, including the nested user', () => {
    const like = {
      id: 'like-1',
      userId: user.id,
      recordId: 7,
      user,
      createdAt,
    }

    expect(toGatewayLike(like)).toEqual({
      id: 'like-1',
      userId: 'user-1',
      recordId: 7,
      user: { ...user, createdAt: '2026-02-03T04:05:06.000Z' },
      createdAt: '2026-02-03T04:05:06.000Z',
    })
  })

  it('keeps a null user as null and omits an absent one', () => {
    const base = { id: 'like-1', userId: 'user-1', recordId: 7, createdAt }

    expect(toGatewayLike({ ...base, user: null })).toMatchObject({ user: null })
    expect(toGatewayLike(base)).not.toHaveProperty('user')
  })
})
