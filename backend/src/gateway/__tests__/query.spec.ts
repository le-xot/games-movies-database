import { describe, expect, it } from 'bun:test'
import { collectArrayQuery } from '@/gateway/query'

function query(url: string, keys: readonly string[]) {
  const target: Record<string, unknown> = {}
  collectArrayQuery(new Request(url), target, keys)

  return target
}

describe('collectArrayQuery', () => {
  it('wraps a single value into an array', () => {
    expect(query('http://localhost/x?status=QUEUE', ['status'])).toEqual({
      status: ['QUEUE'],
    })
  })

  it('keeps every repeated value', () => {
    expect(query('http://localhost/x?status=QUEUE&status=DONE', ['status'])).toEqual({
      status: ['QUEUE', 'DONE'],
    })
  })

  it('leaves absent keys untouched', () => {
    expect(query('http://localhost/x', ['status'])).toEqual({})
  })

  it('ignores keys that were not asked for', () => {
    expect(query('http://localhost/x?page=2', ['status'])).toEqual({})
  })
})
