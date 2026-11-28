import { describe, expect, it } from 'bun:test'
import { secretsMatch } from '@backend/utils/secrets'

describe('secretsMatch', () => {
  const expected = 'super-secret-key'

  it('rejects when no secret is configured', () => {
    expect(secretsMatch(expected, null)).toBe(false)
    expect(secretsMatch(expected, undefined)).toBe(false)
    expect(secretsMatch(expected, '')).toBe(false)
  })

  it('accepts the matching secret', () => {
    expect(secretsMatch(expected, expected)).toBe(true)
  })

  it('rejects a wrong secret of the same length', () => {
    expect(secretsMatch('super-secret-kez', expected)).toBe(false)
  })

  it('rejects secrets of a different length', () => {
    expect(secretsMatch('short', expected)).toBe(false)
    expect(secretsMatch('super-secret-key-longer', expected)).toBe(false)
  })

  it('rejects non-string values', () => {
    expect(secretsMatch(['super-secret-key'], expected)).toBe(false)
    expect(secretsMatch(undefined, expected)).toBe(false)
  })
})
