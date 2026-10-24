import { openapi } from '@elysia/openapi'
import type { Gateway } from '@backend/gateway'

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

/** Служебные роуты документации в продуктовый контракт не входят. */
function dropSpecRoutes(document: Record<string, unknown>): void {
  const paths = document['paths'] as Record<string, unknown> | undefined
  if (!paths) return

  for (const path of Object.keys(paths)) {
    if (path.startsWith(SPEC_PATH)) delete paths[path]
  }
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
  // 3.0, а не 3.1: фронтовый `openapi-typescript` ждёт nullable-идиому из 3.0,
  // иначе `{nullable: true, $ref}` теряет null в сгенерированных типах.
  const documented = app.use(openapi({ provider: null, path: SPEC_PATH, openapiVersion: '3.0.3' }))

  const response = await documented.handle(new Request(`http://localhost${SPEC_PATH}/json`))
  if (!response.ok) {
    throw new Error(`OpenAPI вернул ${response.status}`)
  }

  const document = (await response.json()) as Record<string, unknown>
  canonicalizeRefs(document)
  collapseRefs(document)
  pruneBodyMediaTypes(document)
  dropSpecRoutes(document)

  return document
}

/**
 * Elysia не даёт «ссылку на модель» внутри другой схемы без потери типа: `t.Ref`
 * в статическом типе превращается в `unknown`, и Eden теряет информацию.
 *
 * Поэтому модели ссылаются друг на друга настоящими объектами, а документ
 * сворачивает одинаковые куски обратно в `$ref` — контракт остаётся прежним,
 * типы — точными.
 */
export function collapseRefs(document: Record<string, unknown>): void {
  const schemas = (document['components'] as { schemas?: Record<string, unknown> } | undefined)
    ?.schemas
  if (!schemas) return

  const byShape = new Map<string, string>()
  for (const [name, schema] of Object.entries(schemas)) {
    byShape.set(stableStringify(stripIgnore(schema)), `#/components/schemas/${name}`)
  }

  const walk = (node: unknown): void => {
    if (Array.isArray(node)) {
      for (const item of node) walk(item)
      return
    }
    if (!node || typeof node !== 'object') return

    const record = node as Record<string, unknown>
    for (const [key, value] of Object.entries(record)) {
      // Path-параметры Nest описывал инлайн-перечислением, а query — ссылкой
      // на модель. Держим контракт байт-в-байт: path не сворачиваем.
      if (key === 'parameters' && Array.isArray(value)) {
        for (const parameter of value as Record<string, unknown>[]) {
          if (parameter['in'] === 'path') continue
          walk(parameter)
        }
        continue
      }

      if (
        value &&
        typeof value === 'object' &&
        !Array.isArray(value) &&
        !('$ref' in (value as object))
      ) {
        const ref = byShape.get(stableStringify(stripIgnore(value)))
        if (ref) {
          // `nullable` живёт на самой схеме, а не в определении модели —
          // при сворачивании в `$ref` его надо сохранить рядом.
          // Nullable отдаём идиомой Swagger: `$ref` рядом с `nullable`
          // спецификацией игнорируется, а `allOf` из одного элемента —
          // понимает и `openapi-typescript`, и наш нормализатор.
          record[key] =
            (value as { nullable?: boolean }).nullable === true
              ? { nullable: true, allOf: [{ $ref: ref }] }
              : { $ref: ref }
          continue
        }
      }

      walk(value)
    }
  }

  walk(document['paths'])

  // Внутри компонентов тоже сворачиваем, но не сами определения.
  for (const schema of Object.values(schemas)) walk(schema)
}

function stripIgnore(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(stripIgnore)
  if (!node || typeof node !== 'object') return node

  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
    // `$id` — служебное имя модели, `nullable` — модификатор ссылки.
    if (key === '$id' || key === 'nullable') continue

    // TypeBox пишет nullable ещё и как `type: ['object', 'null']`.
    if (key === 'type' && Array.isArray(value)) {
      const rest = value.filter((item) => item !== 'null')
      out['type'] = rest.length === 1 ? rest[0] : rest
      continue
    }

    out[key] = stripIgnore(value)
  }

  return out
}

function stableStringify(node: unknown): string {
  if (Array.isArray(node)) return `[${node.map(stableStringify).join(',')}]`
  if (!node || typeof node !== 'object') return JSON.stringify(node) ?? 'null'

  const entries = Object.entries(node as Record<string, unknown>)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${JSON.stringify(key)}:${stableStringify(value)}`)

  return `{${entries.join(',')}}`
}
