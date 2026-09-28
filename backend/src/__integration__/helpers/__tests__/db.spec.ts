import { describe, expect, it } from 'bun:test'
import { assertTestDatabase } from '../db'

describe('integration db guard', () => {
  it('rejects non-test database names', () => {
    expect(() => assertTestDatabase('postgresql://user:pass@localhost:5432/lists')).toThrow(
      'non-test database',
    )
    expect(() =>
      assertTestDatabase('postgresql://user:pass@localhost:5432/lists_prod_copy'),
    ).toThrow('non-test database')
  })

  it('accepts _test database names and rejects URLs without a database', () => {
    expect(() =>
      assertTestDatabase('postgresql://user:pass@localhost:5432/lists_test'),
    ).not.toThrow()
    expect(() => assertTestDatabase('postgresql://user:pass@localhost:5432/')).toThrow(
      'no database name',
    )
  })

  it('gives a clear error for keyword DSNs', () => {
    expect(() => assertTestDatabase('host=localhost dbname=lists_test')).toThrow('URL DSN')
  })
})
