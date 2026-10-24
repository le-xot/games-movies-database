import { describe, expect, it } from 'bun:test'
import { clearCookie, serializeCookie } from '@backend/gateway/cookies'

describe('serializeCookie', () => {
  it('builds an httpOnly session cookie', () => {
    expect(
      serializeCookie('token', 'abc', {
        httpOnly: true,
        sameSite: 'lax',
        secure: true,
        path: '/',
        maxAge: 1000,
      }),
    ).toBe('token=abc; Path=/; Max-Age=1000; HttpOnly; Secure; SameSite=Lax')
  })

  it('omits flags that were not asked for', () => {
    expect(serializeCookie('twitch_linking', '1', { path: '/', httpOnly: false })).toBe(
      'twitch_linking=1; Path=/',
    )
  })
})

describe('clearCookie', () => {
  it('expires the cookie immediately', () => {
    expect(clearCookie('token')).toBe('token=; Path=/; Max-Age=0')
  })
})
