import { openapi } from '@elysia/openapi'
import type { Gateway } from '@/gateway'

/** Префикс служебных роутов документации — их нет в контракте продукта. */
export const SPEC_PATH = '/__openapi'

/**
 * Достаёт OpenAPI из живого Elysia-приложения без `listen`: тот же путь, которым
 * ответил бы HTTP-запрос. Плагин документации подключается здесь, а не в
 * `createGateway`, чтобы спека не попадала в прод-роуты.
 */
export async function readGatewayDocument(app: Gateway) {
  const documented = app.use(openapi({ provider: null, path: SPEC_PATH }))

  const response = await documented.handle(new Request(`http://localhost${SPEC_PATH}/json`))
  if (!response.ok) {
    throw new Error(`OpenAPI вернул ${response.status}`)
  }

  return (await response.json()) as Record<string, unknown>
}
