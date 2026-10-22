import createClient from 'openapi-fetch'
import { ref } from 'vue'
import type { paths } from './api-types'

// Типы и enum'ы берутся из сгенерированного контракта — реэкспорт держит
// единственную точку входа для всего приложения.
export * from './api-types'

/** Число активных запросов к API — для тонкого индикатора фоновой загрузки. */
export const apiPendingCount = ref(0)

/**
 * Клиент на fetch. openapi-fetch не бросает исключение на ошибочном статусе, а
 * возвращает `{ data, error }` — бросаем Response сами, чтобы `parseApiError`
 * и `try/catch` на местах вызовов работали как раньше.
 */
export const api = createClient<paths>({
  baseUrl: '/api',
  credentials: 'include',
  fetch: async (request) => {
    apiPendingCount.value += 1
    try {
      const response = await fetch(request)
      if (!response.ok) throw response
      return response
    } finally {
      apiPendingCount.value -= 1
    }
  },
})

/**
 * openapi-fetch типизирует `data` как Maybe, потому что тело ответа может быть
 * пустым. Мы бросаем на `!response.ok`, поэтому достаём данные явно — так типы
 * на местах вызовов остаются строгими без `!` и `?? []`.
 */
export async function unwrap<T>(request: Promise<{ data?: T }>): Promise<T> {
  const { data } = await request
  if (data === undefined) throw new Error('API вернул пустой ответ')
  return data
}
