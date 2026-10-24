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
 * Фикстура снята с Nest перед переездом и с тех пор не менялась — она и есть
 * «тот самый API». Пока `api-types.ts` генерится из контракта, любое расхождение
 * здесь означает, что фронт поедет.
 *
 * Обновлять осознанно: `bun run openapi:golden` в backend.
 */
describe('OpenAPI contract', () => {
  it('matches the golden snapshot', async () => {
    const document = await readGatewayDocument(createTestGateway())

    expect(normalizeContract(document)).toEqual(JSON.parse(readFileSync(FIXTURE, 'utf8')))
  }, 30_000)
})
