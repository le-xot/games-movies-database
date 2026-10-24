import { describe, expect, it } from 'bun:test'
import { normalizeContract } from '@/utils/openapi-contract'

function normalizeSchema(schema: unknown) {
  const document = {
    paths: {
      '/x': { get: { responses: { 200: { content: { 'application/json': { schema } } } } } },
    },
    components: { schemas: {} },
  }

  const operation = normalizeContract(document).paths['GET /x'] as
    | { responses: unknown }
    | undefined

  return operation?.responses
}

describe('normalizeContract', () => {
  it('unwraps the Swagger nullable idiom (allOf of one)', () => {
    const responses = normalizeSchema({
      type: 'object',
      properties: {
        genre: { nullable: true, allOf: [{ $ref: '#/components/schemas/RecordGenre' }] },
      },
      required: ['genre'],
    })

    expect(responses).toEqual({
      '200': {
        type: 'object',
        properties: { genre: { $ref: 'RecordGenre', nullable: true } },
        required: ['genre'],
      },
    })
  })

  it('unwraps the TypeBox nullable idiom (anyOf with null)', () => {
    const responses = normalizeSchema({
      type: 'object',
      properties: {
        genre: {
          nullable: true,
          anyOf: [{ $ref: '#/components/schemas/RecordGenre' }, { type: 'null' }],
        },
      },
      required: ['genre'],
    })

    expect(responses).toEqual({
      '200': {
        type: 'object',
        properties: { genre: { $ref: 'RecordGenre', nullable: true } },
        required: ['genre'],
      },
    })
  })

  it('keeps real unions, order-independent', () => {
    const first = normalizeSchema({
      oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
    })
    const second = normalizeSchema({
      oneOf: [{ type: 'array', items: { type: 'string' } }, { type: 'string' }],
    })

    expect(first).toEqual(second)
  })

  it('drops descriptions and examples', () => {
    const withNoise = normalizeSchema({ type: 'string', description: 'hi', example: 'x' })
    const without = normalizeSchema({ type: 'string' })

    expect(withNoise).toEqual(without)
  })
})
