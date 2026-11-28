import { describe, expect, it } from 'bun:test'
import { requireAuthenticated, type Authenticator, type GatewayUser } from '@backend/gateway/auth'
import { ForbiddenError, UnauthorizedError } from '@backend/utils/errors'

const USER: GatewayUser = {
  id: 'user-1',
  login: 'lexot',
  role: 'USER',
  profileImageUrl: '',
  color: '#fff',
  hasCustomAvatar: false,
  avatarFrameId: null,
  createdAt: '2026-01-01T00:00:00.000Z',
}

const auth: Authenticator = {
  resolve: async (token) => (token === 'valid' ? USER : null),
}

const request = (cookie?: string) =>
  new Request('http://localhost/api/me', {
    headers: cookie ? { cookie } : undefined,
  })

describe('requireAuthenticated', () => {
  it('throws 401 without a token cookie', async () => {
    await expect(requireAuthenticated(auth, request())).rejects.toBeInstanceOf(UnauthorizedError)
  })

  it('throws 401 when the token is unknown', async () => {
    await expect(requireAuthenticated(auth, request('token=broken'))).rejects.toBeInstanceOf(
      UnauthorizedError,
    )
  })

  it('returns the user for a valid token', async () => {
    await expect(requireAuthenticated(auth, request('token=valid'))).resolves.toBe(USER)
  })

  it('throws 403 when the role is not allowed', async () => {
    await expect(
      requireAuthenticated(auth, request('token=valid'), ['ADMIN']),
    ).rejects.toBeInstanceOf(ForbiddenError)
  })

  it('returns the user when the role is allowed', async () => {
    await expect(
      requireAuthenticated(auth, request('token=valid'), ['USER', 'ADMIN']),
    ).resolves.toBe(USER)
  })
})
