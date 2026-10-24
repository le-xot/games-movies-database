import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'

/**
 * Собирает OpenAPI из Elysia-гейтвея в `frontend/openapi.json`, откуда
 * `openapi-typescript` делает типы для фронта.
 *
 * HTTP-сервер не поднимается: документ достаётся через `app.handle()`. БД и
 * Redis не нужны — пул соединений ленивый, а роуты до первого запроса не
 * выполняются.
 */
process.env.NODE_ENV = 'development'
process.env.DATASOURCE_URL ??= 'postgresql://openapi:openapi@127.0.0.1:5432/openapi'
process.env.JWT_SECRET ??= 'openapi-export'
process.env.TWITCH_CALLBACK_URL ??= 'http://localhost:3000/api/auth/twitch/callback'

const { createContainer } = await import('@/server/container')
const { createGateway } = await import('@/gateway')
const { readGatewayDocument, SPEC_PATH } = await import('@/gateway/openapi')

const OUTPUT = join(import.meta.dir, '..', '..', 'frontend', 'openapi.json')

const container = createContainer()
const document = await readGatewayDocument(createGateway(container.deps))

// Служебные роуты документации в контракт продукта не входят.
const paths = document['paths'] as Record<string, unknown>
for (const path of Object.keys(paths)) {
  if (path.startsWith(SPEC_PATH)) delete paths[path]
}

writeFileSync(OUTPUT, `${JSON.stringify(document, null, 2)}\n`)

const removed = { server: container.close() }
console.log(`✅ OpenAPI: ${Object.keys(paths).length} путей → frontend/openapi.json`)

await removed.server
process.exit(0)
