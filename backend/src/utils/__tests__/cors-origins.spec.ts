import { describe, expect, it } from 'bun:test'
import { DEFAULT_CORS_ORIGINS, isOriginAllowed, parseCorsOrigins } from '../cors-origins'

describe('parseCorsOrigins', () => {
  it('splits a comma separated list and trims whitespace', () => {
    expect(parseCorsOrigins('http://a.example, https://b.example ,http://c.example')).toEqual([
      'http://a.example',
      'https://b.example',
      'http://c.example',
    ])
  })

  it('drops empty entries', () => {
    expect(parseCorsOrigins('http://a.example,,  ,')).toEqual(['http://a.example'])
  })

  it('returns an empty list for missing values', () => {
    expect(parseCorsOrigins(null)).toEqual([])
    expect(parseCorsOrigins(undefined)).toEqual([])
    expect(parseCorsOrigins('')).toEqual([])
  })

  it('defaults include local dev and the production origin', () => {
    expect(parseCorsOrigins(DEFAULT_CORS_ORIGINS)).toEqual([
      'http://localhost:3000',
      'http://localhost:5173',
      'https://le-xot.dev',
    ])
  })
})

describe('isOriginAllowed', () => {
  const allowed = ['http://localhost:5173', 'https://le-xot.dev']

  it('allows whitelisted origins', () => {
    expect(isOriginAllowed('https://le-xot.dev', allowed)).toBe(true)
  })

  it('rejects unknown origins', () => {
    expect(isOriginAllowed('https://evil.example', allowed)).toBe(false)
  })

  it('allows requests without an origin header', () => {
    expect(isOriginAllowed(undefined, allowed)).toBe(true)
  })
})
