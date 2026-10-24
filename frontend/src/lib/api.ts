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
  typeof window === 'undefined' ? 'http://localhost/api' : new URL('/api', window.location.origin).toString()

export const api = treaty<App>(apiBase, {
  fetch: { credentials: 'include' },
})

interface EdenResult<T> {
  data?: T | null
  error?: unknown
  status: number
}

/**
 * Достаёт данные или бросает `Response` с телом ошибки — на этом построены
 * `parseApiError` и `try/catch` на местах вызовов. Eden сам не бросает.
 */
export async function unwrap<T>(request: Promise<EdenResult<T>>): Promise<T> {
  const result = await request

  if (result.error !== undefined && result.error !== null) {
    throw new Response(JSON.stringify(result.error), {
      status: result.status,
      headers: { 'content-type': 'application/json' },
    })
  }

  if (result.data === undefined || result.data === null) {
    throw new Error('API вернул пустой ответ')
  }

  return result.data
}
