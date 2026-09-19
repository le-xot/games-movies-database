import { describe, expect, it } from 'bun:test'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { GetLikesDTO } from '../like.dto'

const validateQuery = (query: Record<string, unknown>) =>
  validate(plainToInstance(GetLikesDTO, query))

describe('GetLikesDTO pagination', () => {
  it('accepts an empty query', async () => {
    expect(await validateQuery({})).toHaveLength(0)
  })

  it('accepts boundary values page=1 and limit=100', async () => {
    expect(await validateQuery({ page: 1, limit: 100 })).toHaveLength(0)
  })

  it.each([0, -1, 10_001])('rejects page=%s', async (page) => {
    expect(await validateQuery({ page })).not.toHaveLength(0)
  })

  it.each([0, -1, 101, 1_000_000])('rejects limit=%s', async (limit) => {
    expect(await validateQuery({ limit })).not.toHaveLength(0)
  })
})
