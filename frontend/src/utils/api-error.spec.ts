import { describe, expect, it } from 'bun:test'
import { parseApiError } from '@/utils/api-error'

describe('parseApiError', () => {
  it('reads a string message from a Response', async () => {
    const response = new Response(JSON.stringify({ message: 'boom' }), { status: 400 })

    expect(await parseApiError(response, 'fallback')).toBe('boom')
  })

  it('joins array messages from validation errors', async () => {
    const response = new Response(JSON.stringify({ message: ['a', 'b'] }), { status: 400 })

    expect(await parseApiError(response, 'fallback')).toBe('a; b')
  })

  it('falls back for empty or unknown values', async () => {
    expect(await parseApiError(undefined, 'fallback')).toBe('fallback')
    expect(await parseApiError({ message: '   ' }, 'fallback')).toBe('fallback')
    expect(await parseApiError({ error: { message: 'nested' } }, 'fallback')).toBe('nested')
  })
})
