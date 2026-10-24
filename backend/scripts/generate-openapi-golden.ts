import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'

/**
 * Перегенерирует golden-снапшот контракта, по которому проверяется
 * `src/__tests__/openapi-contract.spec.ts`.
 *
 * Запускать осознанно: обновление фикстуры означает, что контракт изменился и
 * `frontend/src/lib/api-types.ts` поедет.
 */
process.env.NODE_ENV = 'development'
process.env.DATASOURCE_URL ??= 'postgresql://openapi:openapi@127.0.0.1:5432/openapi'
process.env.JWT_SECRET ??= 'openapi-export'
process.env.TWITCH_CALLBACK_URL ??= 'http://localhost:3000/api/auth/twitch/callback'

const { buildContract, normalizeContract } = await import('@/utils/openapi-contract')

const OUTPUT = join(import.meta.dir, '..', 'src', '__tests__', 'fixtures', 'openapi.golden.json')

const document = await buildContract()
const normalized = normalizeContract(document)

mkdirSync(join(OUTPUT, '..'), { recursive: true })
writeFileSync(OUTPUT, `${JSON.stringify(normalized, null, 2)}\n`)

// Приводим файл к тому же виду, что требует `bun format:check`, иначе CI
// ругается на сгенерированную фикстуру.
Bun.spawnSync(['bun', 'fmt', OUTPUT], { stdout: 'ignore', stderr: 'ignore' })

console.log(
  `✅ Контракт: ${Object.keys(normalized.paths as object).length} операций, ` +
    `${Object.keys(normalized.schemas as object).length} схем → ${OUTPUT}`,
)

process.exit(0)
