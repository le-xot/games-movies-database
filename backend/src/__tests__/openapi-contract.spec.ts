import { describe, expect, it } from 'bun:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createTestGateway } from '@backend/__tests__/helpers/gateway-stub'
import { readGatewayDocument } from '@backend/gateway/openapi'
import { normalizeContract } from '@backend/utils/openapi-contract'

const FIXTURE = join(import.meta.dir, 'fixtures', 'openapi.golden.json')

/**
 * Контракт целиком: все операции и все схемы разом.
 *
 * Фикстура снята с Nest перед переездом и служит независимым оракулом. Дважды
 * перегенерирована осознанно: на переезде (media-type обёртка нормализатора) и
 * при починке `friendsCounts`/`extra` — Nest в своём документе описывал их как
 * пустые объекты, хотя отдавал реальные словари.
 *
 * Любое расхождение здесь означает, что контракт изменился. Обновлять
 * осознанно: `bun run openapi:golden` в backend.
 */
describe('OpenAPI contract', () => {
  it('matches the golden snapshot', async () => {
    const document = await readGatewayDocument(createTestGateway())

    expect(normalizeContract(document)).toEqual(JSON.parse(readFileSync(FIXTURE, 'utf8')))
  }, 30_000)
})
