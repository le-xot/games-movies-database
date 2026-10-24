import { describe, expect, it } from 'bun:test'
import { JwtService } from '@nestjs/jwt'
import { createJwtAuthenticator } from '@/gateway/jwt-authenticator'
import type { GatewayUser } from '@/gateway/auth'

const SECRET = 'test-secret'
const OTHER_SECRET = 'other-secret'

const USER: GatewayUser = {
  id: 'user-1',
  login: 'le-xot',
  role: 'USER',
  profileImageUrl: '',
  color: '#000000',
  hasCustomAvatar: false,
  createdAt: '2026-01-01T00:00:00.000Z',
}

// Токены подписываются тем же @nestjs/jwt, которым подписывает прод: проверяем
// совместимость с тем, что уже лежит в куках у пользователей.
const jwt = new JwtService({ secret: SECRET, signOptions: { expiresIn: '30d' } })

function authenticator(user: GatewayUser | null = USER) {
  return createJwtAuthenticator({
    secret: SECRET,
    users: { getById: async () => user },
  })
}

describe('createJwtAuthenticator', () => {
  it('resolves the user from a token signed by @nestjs/jwt', async () => {
    const token = await jwt.signAsync({ id: USER.id })

    expect(await authenticator().resolve(token)).toEqual(USER)
  })

  it('returns null for a user that no longer exists', async () => {
    const token = await jwt.signAsync({ id: 'deleted-user' })

    expect(await authenticator(null).resolve(token)).toBeNull()
  })

  it('returns null for a token signed with another secret', async () => {
    const foreign = new JwtService({ secret: OTHER_SECRET })
    const token = await foreign.signAsync({ id: USER.id })

    expect(await authenticator().resolve(token)).toBeNull()
  })

  it('returns null for garbage instead of throwing', async () => {
    expect(await authenticator().resolve('not-a-jwt')).toBeNull()
  })

  it('returns null when the payload has no user id', async () => {
    const token = await jwt.signAsync({ login: USER.login })

    expect(await authenticator().resolve(token)).toBeNull()
  })
})
