import { treaty } from '@elysia/eden'
import type { App } from '@backend/gateway'

// Значения (enum'ы) и типы WS-событий живут в общем пакете — фронт берёт их
// отсюда, чтобы не менять импорты на местах.
export * from '@gmdb/contract'
export type * from '@backend/api-types'

/**
 * Клиент Eden: типы выводятся напрямую из `App`, кодогена нет.
 *
 * `import type { App }` стирается компилятором, поэтому серверный код в бандл
 * не попадает — в рантайме это обычный Proxy над `fetch`.
 */
// В браузере база абсолютная (относительный URL Eden не собирает), в тестах
// `window` нет — там клиент всё равно не ходит в сеть.
const apiBase =
  typeof window === 'undefined'
    ? 'http://localhost/api'
    : new URL('/api', window.location.origin).toString()

export const api = treaty<App>(apiBase, {
  fetch: { credentials: 'include' },
})

interface EdenResult<T> {
  data?: T | null
  error?: unknown
  status: number
}

/** Eden отдаёт ошибку обёрткой `{ status, value }`, тело лежит в `value`. */
interface EdenErrorEnvelope {
  status?: number
  value?: unknown
}

function toErrorResponse(result: { error?: unknown; status: number }): Response {
  const envelope = result.error as EdenErrorEnvelope | undefined
  const body = envelope?.value ?? envelope ?? result.error
  const status = envelope?.status ?? result.status

  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

/**
 * Достаёт данные или бросает `Response` с телом ошибки — на этом построены
 * `parseApiError` и `try/catch` на местах вызовов. Eden сам не бросает.
 *
 * `null` — валидный ответ: так отвечает `GET /wordle/practice`, когда раунда
 * нет. Ошибка — только отсутствие тела (`undefined`).
 */
export async function unwrap<T>(request: Promise<EdenResult<T>>): Promise<T> {
  const result = await request

  if (result.error !== undefined && result.error !== null) {
    throw toErrorResponse(result)
  }

  if (result.data === undefined || (result.data as unknown) === '') {
    throw new Error('API вернул пустой ответ')
  }

  return result.data as T
}

/**
 * Для мутаций, у которых тело не нужно: проверяет только факт ошибки.
 *
 * Нужен потому, что Eden не бросает исключение на HTTP-ошибку — без него
 * `try/catch` на месте вызова никогда не срабатывает и UI рапортует об успехе.
 */
export async function assertOk(
  request: Promise<{ error?: unknown; status: number }>,
): Promise<void> {
  const result = await request

  if (result.error !== undefined && result.error !== null) {
    throw toErrorResponse(result)
  }
}
