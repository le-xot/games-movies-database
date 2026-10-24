import { describe, expect, it } from 'bun:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { buildContract, normalizeContract } from '@/utils/openapi-contract'

const FIXTURE = join(import.meta.dir, 'fixtures', 'openapi.golden.json')

/**
 * Golden-снапшот контракта. Пока в проекте есть `api-types.ts`, он генерится
 * из этого контракта — значит любое расхождение здесь означает, что фронт
 * поедет. Во время переезда на Elysia этот тест — главный oracle.
 *
 * Обновлять осознанно: `bun run openapi:golden` в backend.
 */
describe('OpenAPI contract', () => {
  it('matches the golden snapshot', async () => {
    const document = await buildContract()

    expect(normalizeContract(document)).toEqual(JSON.parse(readFileSync(FIXTURE, 'utf8')))
  }, 30_000)
})
