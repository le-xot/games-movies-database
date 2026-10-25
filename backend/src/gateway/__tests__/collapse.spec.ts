import { describe, expect, it } from 'bun:test'
import { collapseRefs } from '@backend/gateway/openapi'

describe('collapseRefs', () => {
  it('replaces an inline schema that duplicates a component with $ref', () => {
    const document = {
      paths: {
        '/x': {
          get: {
            responses: {
              200: {
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: { status: { type: 'string', enum: ['A', 'B'] } },
                    },
                  },
                },
              },
            },
          },
        },
      },
      components: {
        schemas: {
          Status: { type: 'string', enum: ['A', 'B'], $id: '#/components/schemas/Status' },
        },
      },
    }

    collapseRefs(document as never)

    const responses = (
      document as unknown as {
        paths: Record<
          string,
          {
            get: {
              responses: Record<
                string,
                { content: Record<string, { schema: { properties: Record<string, unknown> } }> }
              >
            }
          }
        >
      }
    ).paths['/x']!.get.responses

    const schema = responses['200']!.content['application/json']!.schema

    expect(schema.properties.status).toEqual({ $ref: '#/components/schemas/Status' })
  })

  it('leaves the components themselves alone', () => {
    const document = {
      paths: {},
      components: { schemas: { Status: { type: 'string', enum: ['A'] } } },
    }

    collapseRefs(document as never)

    expect(
      (document as never as { components: { schemas: Record<string, unknown> } }).components.schemas
        .Status,
    ).toEqual({ type: 'string', enum: ['A'] })
  })
})
