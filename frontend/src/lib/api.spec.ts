import { afterEach, describe, expect, it } from 'bun:test'
import { parseApiError } from '../utils/api-error'
import { api, assertOk, unwrap } from './api'

/**
 * Клиент Eden — единственное место, где форма ответа превращается в исключение.
 * Ошибки здесь стоят дорого: `parseApiError` получает уже испорченное тело, а
 * `unwrap` решает, считать ли пустой ответ ошибкой.
 */
const realFetch = globalThis.fetch

function stubFetch(status: number, body: string): void {
  globalThis.fetch = (async () =>
    body === ''
      ? new Response(null, { status })
      : new Response(body, {
          status,
          headers: { 'content-type': 'application/json' },
        })) as unknown as typeof fetch
}

afterEach(() => {
  globalThis.fetch = realFetch
})

describe('unwrap', () => {
  it('returns the body of a successful response', async () => {
    stubFetch(200, JSON.stringify({ records: [], total: 0 }))

    const page = await unwrap(api.records.get({ query: { limit: 1 } }))

    expect(page).toEqual({ records: [], total: 0 })
  })

  it('treats a null body as a valid answer', async () => {
    // `GET /wordle/practice` отдаёт ровно `null`, когда раунда нет.
    stubFetch(200, 'null')

    expect(await unwrap(api.wordle.practice.get())).toBeNull()
  })

  it('rejects an empty body instead of returning it as data', async () => {
    stubFetch(200, '')

    const error = await unwrap(api.auth.me.get()).catch((caught: unknown) => caught)

    expect(error).toBeInstanceOf(Error)
    expect((error as Error).message).toContain('пустой ответ')
  })

  it('throws a Response carrying the server envelope', async () => {
    stubFetch(409, JSON.stringify({ statusCode: 409, message: 'Ник уже занят' }))

    const error = await unwrap(api.auth.me.get()).catch((caught: unknown) => caught)

    expect(error).toBeInstanceOf(Response)
    expect(await parseApiError(error, 'fallback')).toBe('Ник уже занят')
  })
})

describe('assertOk', () => {
  it('resolves for a successful mutation', async () => {
    stubFetch(204, '')

    await expect(assertOk(api.records({ id: 1 }).delete())).resolves.toBeUndefined()
  })

  it('throws for a failed mutation so the caller can report it', async () => {
    stubFetch(403, JSON.stringify({ statusCode: 403, message: 'Нет прав' }))

    const error = await assertOk(api.records({ id: 1 }).delete()).catch((caught: unknown) => caught)

    expect(error).toBeInstanceOf(Response)
    expect(await parseApiError(error, 'fallback')).toBe('Нет прав')
  })
})
