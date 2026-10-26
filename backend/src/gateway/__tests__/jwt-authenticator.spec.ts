import { describe, expect, it } from 'bun:test'
import { createJwtAuthenticator } from '@backend/gateway/jwt-authenticator'
import { SignJWT } from 'jose'
import type { GatewayUser } from '@backend/gateway/auth'

const SECRET = 'test-secret'
const OTHER_SECRET = 'other-secret'

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

async function sign(payload: Record<string, unknown>, secret = SECRET): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(new TextEncoder().encode(secret))
}

function authenticator(user: GatewayUser | null = USER) {
  return createJwtAuthenticator({
    secret: SECRET,
    users: { getById: async () => user },
  })
}

describe('createJwtAuthenticator', () => {
  it('resolves the user from a signed token', async () => {
    const token = await sign({ id: USER.id })

    expect(await authenticator().resolve(token)).toEqual(USER)
  })

  it('returns null for a user that no longer exists', async () => {
    const token = await sign({ id: 'deleted-user' })

    expect(await authenticator(null).resolve(token)).toBeNull()
  })

  it('returns null for a token signed with another secret', async () => {
    const token = await sign({ id: USER.id }, OTHER_SECRET)

    expect(await authenticator().resolve(token)).toBeNull()
  })

  it('returns null for garbage instead of throwing', async () => {
    expect(await authenticator().resolve('not-a-jwt')).toBeNull()
  })

  it('returns null when the payload has no user id', async () => {
    const token = await sign({ login: USER.login })

    expect(await authenticator().resolve(token)).toBeNull()
  })

  it('returns null for a token with another algorithm', async () => {
    const token = await new SignJWT({ id: USER.id })
      .setProtectedHeader({ alg: 'HS512' })
      .sign(new TextEncoder().encode(SECRET))

    expect(await authenticator().resolve(token)).toBeNull()
  })
})
