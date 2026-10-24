import { describe, expect, it } from 'bun:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createGateway } from '@/gateway'
import { readGatewayDocument } from '@/gateway/openapi'
import { normalizeContract } from '@/utils/openapi-contract'

const GOLDEN = JSON.parse(
  readFileSync(join(import.meta.dir, 'fixtures', 'openapi.golden.json'), 'utf8'),
)

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

/**
 * Сверяет одну операцию Elysia-гейтвея с эталоном Nest: и саму операцию, и все
 * схемы, на которые она ссылается. Так проверяется не только форма ответа, но и
 * имена компонентов — от них зависит `$ref` в сгенерированных типах фронта.
 */
async function expectSameOperation(key: string) {
  const gateway = createGateway({
    weather: { getWeatherData: async () => null },
  })

  const actual = normalizeContract(await readGatewayDocument(gateway))
  const expected = GOLDEN as Normalized

  expect(actual.paths[key]).toEqual(expected.paths[key])

  for (const name of collectRefs(actual.paths[key])) {
    expect({ [name]: actual.schemas[name] }).toEqual({ [name]: expected.schemas[name] })
  }
}

describe('Elysia gateway contract', () => {
  it('serves GET /weather exactly like the Nest contract', async () => {
    await expectSameOperation('GET /weather')
  }, 20_000)
})
