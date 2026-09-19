import { describe, expect, it } from 'bun:test'
import { isApiKeyValid } from '../auth.apikey.guard'

describe('isApiKeyValid', () => {
  const expected = 'super-secret-key'

  it('rejects when no key is configured', () => {
    expect(isApiKeyValid(expected, null)).toBe(false)
    expect(isApiKeyValid(expected, undefined)).toBe(false)
    expect(isApiKeyValid(expected, '')).toBe(false)
  })

  it('accepts the matching key', () => {
    expect(isApiKeyValid(expected, expected)).toBe(true)
  })

  it('rejects a wrong key of the same length', () => {
    expect(isApiKeyValid('super-secret-kez', expected)).toBe(false)
  })

  it('rejects keys of a different length', () => {
    expect(isApiKeyValid('short', expected)).toBe(false)
  })

  it('rejects non-string headers', () => {
    expect(isApiKeyValid(['super-secret-key'], expected)).toBe(false)
    expect(isApiKeyValid(undefined, expected)).toBe(false)
  })
})
