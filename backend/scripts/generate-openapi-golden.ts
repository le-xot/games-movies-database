import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'

/**
 * Перегенерирует golden-снапшот контракта, по которому проверяется
 * `src/__tests__/openapi-contract.spec.ts`.
 *
 * ВНИМАНИЕ: снапшот снят с Nest ДО переезда и служит независимым оракулом.
 * Скрипт собирает документ из текущей реализации, поэтому его запуск после
 * реального расхождения просто узаконит это расхождение. Запускать только
 * когда расхождение осознано и описано в коммите.
 */
process.env.NODE_ENV = 'development'
process.env.DATASOURCE_URL ??= 'postgresql://openapi:openapi@127.0.0.1:5432/openapi'
process.env.JWT_SECRET ??= 'openapi-export'
process.env.TWITCH_CALLBACK_URL ??= 'http://localhost:3000/api/auth/twitch/callback'

const { createContainer } = await import('@backend/server/container')
const { createGateway } = await import('@backend/gateway')
const { readGatewayDocument } = await import('@backend/gateway/openapi')
const { normalizeContract } = await import('@backend/utils/openapi-contract')

const OUTPUT = join(import.meta.dir, '..', 'src', '__tests__', 'fixtures', 'openapi.golden.json')

const container = createContainer()
const document = await readGatewayDocument(createGateway(container.deps))
const normalized = normalizeContract(document)

mkdirSync(join(OUTPUT, '..'), { recursive: true })
writeFileSync(OUTPUT, `${JSON.stringify(normalized, null, 2)}\n`)

// Приводим файл к тому же виду, что требует `bun format:check`, иначе CI
// ругается на сгенерированную фикстуру.
Bun.spawnSync(['bun', 'fmt', OUTPUT], { stdout: 'ignore', stderr: 'ignore' })

console.log(
  `✅ Контракт: ${Object.keys(normalized.paths).length} операций, ` +
    `${Object.keys(normalized.schemas).length} схем → ${OUTPUT}`,
)

await container.close()
process.exit(0)
