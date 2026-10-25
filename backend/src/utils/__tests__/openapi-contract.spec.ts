import { describe, expect, it } from 'bun:test'
import { normalizeContract } from '@backend/utils/openapi-contract'

function normalizeOperation(response: unknown, contentType = 'application/json') {
  const document = {
    paths: {
      '/x': { get: { responses: { 200: { content: { [contentType]: { schema: response } } } } } },
    },
    components: { schemas: {} },
  }

  const operation = normalizeContract(document).paths['GET /x'] as
    | { responses: Record<string, Record<string, unknown>> }
    | undefined

  return operation?.responses
}

function normalizeSchema(schema: unknown) {
  return normalizeOperation(schema)?.['200']?.['application/json']
}

describe('normalizeContract', () => {
  it('keeps the media type of the response body', () => {
    expect(
      normalizeOperation(
        { type: 'object', properties: { file: { type: 'string' } } },
        'multipart/form-data',
      ),
    ).toEqual({
      '200': {
        'multipart/form-data': {
          type: 'object',
          properties: { file: { type: 'string' } },
          required: [],
        },
      },
    })
  })

  it('unwraps the Swagger nullable idiom (allOf of one)', () => {
    const schema = normalizeSchema({
      type: 'object',
      properties: {
        genre: { nullable: true, allOf: [{ $ref: '#/components/schemas/RecordGenre' }] },
      },
      required: ['genre'],
    })

    expect(schema).toEqual({
      type: 'object',
      properties: { genre: { $ref: 'RecordGenre', nullable: true } },
      required: ['genre'],
    })
  })

  it('unwraps the TypeBox nullable idiom (anyOf with null)', () => {
    const schema = normalizeSchema({
      type: 'object',
      properties: {
        genre: {
          nullable: true,
          anyOf: [{ $ref: '#/components/schemas/RecordGenre' }, { type: 'null' }],
        },
      },
      required: ['genre'],
    })

    expect(schema).toEqual({
      type: 'object',
      properties: { genre: { $ref: 'RecordGenre', nullable: true } },
      required: ['genre'],
    })
  })

  it('unwraps nullable written as a type array', () => {
    const schema = normalizeSchema({
      type: 'object',
      properties: {
        episode: { nullable: true, type: ['string', 'null'] },
        likes: {
          nullable: true,
          type: ['array', 'null'],
          items: { $ref: '#/components/schemas/Like' },
        },
      },
      required: ['episode'],
    })

    expect(schema).toEqual({
      type: 'object',
      properties: {
        episode: { type: 'string', nullable: true },
        likes: { type: 'array', items: { $ref: 'Like' }, nullable: true },
      },
      required: ['episode'],
    })
  })

  it('treats a catch-all patternProperties as additionalProperties', () => {
    const schema = normalizeSchema({
      type: 'object',
      properties: {
        counts: { type: 'object', patternProperties: { '^(.*)$': { type: 'number' } } },
      },
      required: ['counts'],
    })

    expect(schema).toEqual({
      type: 'object',
      properties: {
        counts: {
          type: 'object',
          properties: {},
          required: [],
          additionalProperties: { type: 'number' },
        },
      },
      required: ['counts'],
    })
  })

  it('treats a single const as a one-value enum', () => {
    expect(normalizeSchema({ type: 'string', const: 'SUGGESTION' })).toEqual({
      enum: ['SUGGESTION'],
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
    expect(normalizeSchema({ type: 'string', description: 'hi', example: 'x' })).toEqual(
      normalizeSchema({ type: 'string' }),
    )
  })
})
