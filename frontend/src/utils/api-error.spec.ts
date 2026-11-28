import { describe, expect, it } from 'bun:test'
import { parseApiError } from '@/utils/api-error'

const jsonResponse = (body: unknown, status = 400) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })

describe('parseApiError', () => {
  it('достаёт message из конверта ApiErrorDto', async () => {
    const response = jsonResponse({ statusCode: 409, message: 'Уже привязан', error: 'Conflict' })

    expect(await parseApiError(response)).toBe('Уже привязан')
  })

  it('склеивает массив сообщений валидации', async () => {
    const response = jsonResponse({ statusCode: 400, message: ['title плохой', 'link плохой'] })

    expect(await parseApiError(response)).toBe('title плохой; link плохой')
  })

  it('берёт message у обычной ошибки', async () => {
    expect(await parseApiError(new Error('boom'))).toBe('boom')
  })

  it('возвращает fallback, если сообщения нет', async () => {
    expect(await parseApiError({}, 'Не удалось загрузить')).toBe('Не удалось загрузить')
    expect(await parseApiError(null, 'Не удалось загрузить')).toBe('Не удалось загрузить')
  })

  it('возвращает fallback на битом JSON', async () => {
    const broken = new Response('not json', { status: 500 })

    expect(await parseApiError(broken, 'Не удалось загрузить')).toBe('Не удалось загрузить')
  })
})
