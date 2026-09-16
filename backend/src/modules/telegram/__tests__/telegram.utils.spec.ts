import { describe, expect, it } from 'bun:test'
import { createHash } from 'node:crypto'
import {
  buildTelegramAuthorizeUrl,
  createPkcePair,
  formatTelegramLogin,
  mapTelegramOidcClaims,
} from '../telegram.utils'

describe('createPkcePair', () => {
  it('creates a base64url verifier and its S256 challenge', () => {
    const { verifier, challenge } = createPkcePair()

    expect(verifier.length).toBeGreaterThanOrEqual(43)
    expect(verifier).toMatch(/^[A-Za-z0-9_-]+$/)
    expect(challenge).toBe(createHash('sha256').update(verifier).digest('base64url'))
  })

  it('creates a different pair on each call', () => {
    expect(createPkcePair().verifier).not.toBe(createPkcePair().verifier)
  })
})

describe('buildTelegramAuthorizeUrl', () => {
  const params = {
    clientId: '123456',
    redirectUri: 'https://le-xot.dev/api/auth/telegram/oidc/callback',
    state: 'state-1',
    codeChallenge: 'challenge-1',
  }

  it('builds the authorization URL with required parameters', () => {
    const url = buildTelegramAuthorizeUrl(params)

    expect(url.startsWith('https://oauth.telegram.org/auth?')).toBe(true)
    expect(url).toContain('client_id=123456')
    expect(url).toContain(
      'redirect_uri=https%3A%2F%2Fle-xot.dev%2Fapi%2Fauth%2Ftelegram%2Foidc%2Fcallback',
    )
    expect(url).toContain('response_type=code')
    expect(url).toContain('scope=openid%20profile')
    expect(url).toContain('state=state-1')
    expect(url).toContain('code_challenge=challenge-1')
    expect(url).toContain('code_challenge_method=S256')
  })
})

describe('formatTelegramLogin', () => {
  it('prefers the username', () => {
    const login = formatTelegramLogin({
      id: '42',
      username: 'ivan',
      firstName: 'Ivan',
      lastName: 'Petrov',
    })
    expect(login).toBe('ivan')
  })

  it('falls back to first and last name', () => {
    expect(formatTelegramLogin({ id: '42', firstName: 'Ivan', lastName: 'Petrov' })).toBe(
      'Ivan Petrov',
    )
    expect(formatTelegramLogin({ id: '42', firstName: 'Ivan' })).toBe('Ivan')
  })

  it('falls back to tg_<id> when the name is empty', () => {
    expect(formatTelegramLogin({ id: '42', firstName: '' })).toBe('tg_42')
  })
})

describe('mapTelegramOidcClaims', () => {
  it('maps claims to a telegram profile', () => {
    const profile = mapTelegramOidcClaims({
      sub: '9999999999999999999',
      id: 42,
      name: 'Ivan Petrov',
      given_name: 'Ivan',
      family_name: 'Petrov',
      preferred_username: 'ivan',
      picture: 'https://cdn4.telesco.pe/file/photo.jpg',
    })

    expect(profile).toEqual({
      id: '42',
      username: 'ivan',
      firstName: 'Ivan',
      lastName: 'Petrov',
      photoUrl: 'https://cdn4.telesco.pe/file/photo.jpg',
    })
  })

  it('falls back to sub when the telegram id is missing', () => {
    const profile = mapTelegramOidcClaims({ sub: 'abc-123' })

    expect(profile.id).toBe('abc-123')
    expect(profile.firstName).toBe('')
  })

  it('falls back to the full name when given_name is missing', () => {
    const profile = mapTelegramOidcClaims({ sub: '1', id: 7, name: 'Ivan Petrov' })

    expect(profile.firstName).toBe('Ivan Petrov')
  })

  it('throws when no user id is present', () => {
    expect(() => mapTelegramOidcClaims({})).toThrow()
  })
})
