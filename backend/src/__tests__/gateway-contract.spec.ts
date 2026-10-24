import { describe, expect, it } from 'bun:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createTestGateway } from '@/__tests__/helpers/gateway-stub'
import { readGatewayDocument } from '@/gateway/openapi'
import { normalizeContract } from '@/utils/openapi-contract'

const GOLDEN = JSON.parse(
  readFileSync(join(import.meta.dir, 'fixtures', 'openapi.golden.json'), 'utf8'),
)

/**
 * Операции, которые уже переехали в гейтвей. Каждая обязана совпадать с
 * эталоном Nest: форма ответа, коды, параметры и все схемы, на которые она
 * ссылается (имена схем — это `$ref` в типах фронта).
 */
const MIGRATED_OPERATIONS = [
  'GET /weather',
  'GET /auth/me',
  'GET /stats/records',
  'GET /queue',
  'POST /likes',
  'DELETE /likes/{recordId}',
  'GET /likes/records/{id}',
  'GET /likes/users/{id}',
  'GET /likes/count',
  'POST /records/link',
  'GET /records',
  'GET /records/{id}',
  'PATCH /records/{id}',
  'PATCH /records/{id}/poster',
  'DELETE /records/{id}',
  'PUT /ratings/{recordId}',
  'DELETE /ratings/{recordId}',
  'GET /ratings/my',
  'GET /ratings/users/{id}',
  'GET /ratings/friends',
] as const

type Normalized = ReturnType<typeof normalizeContract>
type Json = Record<string, unknown>

function collectRefs(node: unknown, found = new Set<string>()): Set<string> {
  if (!node || typeof node !== 'object') return found

  if (typeof (node as Json).$ref === 'string') {
    found.add(String((node as Json).$ref))
    return found
  }

  for (const value of Object.values(node)) collectRefs(value, found)

  return found
}

describe('Elysia gateway contract', () => {
  const expected = GOLDEN as Normalized

  it.each(MIGRATED_OPERATIONS)(
    '%s matches the Nest contract',
    async (operation) => {
      const actual = normalizeContract(await readGatewayDocument(createTestGateway()))

      expect(actual.paths[operation]).toEqual(expected.paths[operation])

      for (const name of collectRefs(actual.paths[operation])) {
        expect({ [name]: actual.schemas[name] }).toEqual({ [name]: expected.schemas[name] })
      }
    },
    20_000,
  )
})
