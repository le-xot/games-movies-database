import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule, type OpenAPIObject } from '@nestjs/swagger'
import { AppModule } from '@/app.module'

const HTTP_METHODS = new Set(['get', 'post', 'put', 'patch', 'delete', 'options', 'head'])

/**
 * Собирает OpenAPI без HTTP-сервера и без подключения к БД: Nest вызывает
 * onModuleInit только на `app.init()`, поэтому достаточно создать приложение.
 * Тем же способом контракт достаёт `scripts/export-openapi.ts`.
 */
export async function buildContract(): Promise<OpenAPIObject> {
  const app = await NestFactory.create(AppModule, { logger: false })

  try {
    return SwaggerModule.createDocument(app, new DocumentBuilder().build())
  } finally {
    await app.close()
  }
}

type Json = null | boolean | number | string | Json[] | { [key: string]: Json }

/**
 * Минимальная форма OpenAPI, которой достаточно для сравнения. Не завязана на
 * `OpenAPIObject` из Nest: тот же нормализатор должен принимать документ Elysia
 * и обычный JSON из фикстуры.
 */
export interface OpenApiDocument {
  paths?: Record<string, Record<string, any>>
  components?: { schemas?: Record<string, any> }
}

function sortKeys(value: { [key: string]: Json }): { [key: string]: Json } {
  return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)))
}

/**
 * Приводит схему к канонической форме: выкидывает описания/примеры/format и
 * разворачивает идиомы Swagger (`allOf` из одного элемента + `nullable`), чтобы
 * сравнение ловило смысловые изменения контракта, а не разницу в записи.
 */
function canonical(schema: any): Json {
  const base = canonicalCore(schema)
  const nullable = Boolean(schema?.nullable) || hasNullVariant(schema)

  if (nullable && typeof base === 'object' && base !== null && !Array.isArray(base)) {
    return sortKeys({ ...base, nullable: true })
  }

  return base
}

/**
 * `t.Nullable(t.Ref('X'))` в TypeBox превращается в
 * `anyOf: [{ $ref: 'X' }, { type: 'null' }]`, а Swagger пишет
 * `nullable: true` рядом с `$ref`. Это одна и та же семантика — сводим к одной.
 */
function hasNullVariant(schema: any): boolean {
  const union = schema?.oneOf ?? schema?.anyOf
  if (!Array.isArray(union)) return false

  return union.some((variant: any) => variant?.type === 'null')
}

function canonicalCore(schema: any): Json {
  if (!schema || typeof schema !== 'object') return null

  if (schema.$ref) {
    return { $ref: String(schema.$ref).replace('#/components/schemas/', '') }
  }

  if (Array.isArray(schema.allOf) && schema.allOf.length === 1) {
    return canonical(schema.allOf[0])
  }

  const union = schema.oneOf ?? schema.anyOf
  if (Array.isArray(union)) {
    const variants = union.map((variant: any) => canonical(variant))
    const withoutNull = variants.filter(
      (variant) => JSON.stringify(variant) !== JSON.stringify({ type: 'null' }),
    )

    // Единственный вариант + null — это nullable-значение, а не union.
    if (withoutNull.length === 1 && variants.length === 2) return withoutNull[0] as Json

    const sorted = withoutNull
      .map((variant) => JSON.stringify(variant))
      .sort()
      .map((variant) => JSON.parse(variant) as Json)

    return { union: sorted }
  }

  if (Array.isArray(schema.enum)) {
    return { enum: schema.enum.map((value: unknown) => value as Json) }
  }

  if (schema.type === 'object') {
    const properties = Object.entries(schema.properties ?? {}).map(([name, value]) => [
      name,
      canonical(value),
    ])

    const result: { [key: string]: Json } = {
      type: 'object',
      properties: sortKeys(Object.fromEntries(properties)),
      required: [...(schema.required ?? [])].sort(),
    }

    if (schema.additionalProperties !== undefined) {
      result.additionalProperties =
        typeof schema.additionalProperties === 'object'
          ? canonical(schema.additionalProperties)
          : Boolean(schema.additionalProperties)
    }

    return sortKeys(result)
  }

  if (schema.type === 'array') {
    return { type: 'array', items: canonical(schema.items) }
  }

  return { type: schema.type ?? 'any' }
}

export interface NormalizedContract {
  paths: { [key: string]: Json }
  schemas: { [key: string]: Json }
}

/**
 * Каноническая форма всего контракта: `METHOD path` → параметры, тело и схемы
 * ответов по кодам. Этого достаточно, чтобы `api-types.ts` не поехал.
 */
export function normalizeContract(document: OpenApiDocument): NormalizedContract {
  const operations: { [key: string]: Json } = {}

  for (const [path, item] of Object.entries(document.paths ?? {})) {
    for (const [method, operation] of Object.entries(item)) {
      if (!HTTP_METHODS.has(method)) continue

      const parameters = (operation.parameters ?? [])
        .map((parameter: any) => ({
          in: parameter.in,
          name: parameter.name,
          required: Boolean(parameter.required),
          schema: canonical(parameter.schema),
        }))
        .sort((a: any, b: any) => `${a.in}:${a.name}`.localeCompare(`${b.in}:${b.name}`))

      const requestBody = operation.requestBody?.content?.['application/json']?.schema

      const responses = Object.fromEntries(
        Object.entries(operation.responses ?? {}).map(([code, response]: [string, any]) => [
          code,
          response.content?.['application/json']?.schema
            ? canonical(response.content['application/json'].schema)
            : null,
        ]),
      )

      operations[`${method.toUpperCase()} ${path}`] = {
        parameters,
        body: requestBody ? canonical(requestBody) : null,
        responses: sortKeys(responses),
      }
    }
  }

  const schemas = Object.entries(document.components?.schemas ?? {}).map(([name, schema]) => [
    name,
    canonical(schema),
  ])

  return {
    paths: sortKeys(operations),
    schemas: sortKeys(Object.fromEntries(schemas)),
  }
}
