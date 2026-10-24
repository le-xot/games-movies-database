import { openapi } from '@elysia/openapi'
import type { Gateway } from '@/gateway'

/** Префикс служебных роутов документации — их нет в контракте продукта. */
export const SPEC_PATH = '/__openapi'

/**
 * Достаёт OpenAPI из живого Elysia-приложения без `listen`: тот же путь, которым
 * ответил бы HTTP-запрос. Плагин документации подключается здесь, а не в
 * `createGateway`, чтобы спека не попадала в прод-роуты.
 */
const SCHEMA_PREFIX = '#/components/schemas/'

/**
 * Elysia ссылается на модели внутри схем коротким именем (`$ref: 'UserEntity'`),
 * а в ответах — полным путём. OpenAPI такого не допускает, и `openapi-typescript`
 * на коротких ссылках падает с `Can't resolve $ref`. Приводим всё к полному виду.
 */
function canonicalizeRefs(node: unknown): void {
  if (!node || typeof node !== 'object') return

  const record = node as Record<string, unknown>
  if (typeof record['$ref'] === 'string' && !record['$ref'].includes('/')) {
    record['$ref'] = `${SCHEMA_PREFIX}${record['$ref']}`
  }

  for (const value of Object.values(record)) canonicalizeRefs(value)
}

/**
 * Elysia описывает JSON-тело сразу в трёх типах содержимого (json, urlencoded,
 * multipart), потому что умеет принимать любое из них. В контракте это шум:
 * фронт ходит только JSON'ом, а загрузка файла — только multipart.
 * Оставляем тот тип, который эндпоинт действительно ждёт.
 */
/** Есть ли в схеме бинарное поле (`format: binary`). */
function containsBinary(node: unknown): boolean {
  if (!node || typeof node !== 'object') return false

  const record = node as Record<string, unknown>
  if (record['format'] === 'binary') return true

  return Object.values(record).some((value) => containsBinary(value))
}

function pruneBodyMediaTypes(document: Record<string, unknown>): void {
  const paths = document['paths'] as
    | Record<string, Record<string, { requestBody?: { content?: Record<string, unknown> } }>>
    | undefined

  for (const item of Object.values(paths ?? {})) {
    for (const operation of Object.values(item)) {
      const content = operation?.requestBody?.content
      if (!content) continue

      const keys = Object.keys(content)
      const isUpload = Object.values(content).some((media) =>
        containsBinary((media as { schema?: unknown } | undefined)?.schema),
      )
      const keep = isUpload ? 'multipart/form-data' : 'application/json'
      if (!keys.includes(keep)) continue

      for (const key of keys) {
        if (key !== keep) delete content[key]
      }
    }
  }
}

export async function readGatewayDocument(app: Gateway) {
  const documented = app.use(openapi({ provider: null, path: SPEC_PATH }))

  const response = await documented.handle(new Request(`http://localhost${SPEC_PATH}/json`))
  if (!response.ok) {
    throw new Error(`OpenAPI вернул ${response.status}`)
  }

  const document = (await response.json()) as Record<string, unknown>
  canonicalizeRefs(document)
  pruneBodyMediaTypes(document)

  return document
}
