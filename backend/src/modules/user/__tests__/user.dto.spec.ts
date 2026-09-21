import { describe, expect, it } from 'bun:test'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { MergeUsersDto } from '../user.dto'

const validateDto = (body: Record<string, unknown>) =>
  validate(plainToInstance(MergeUsersDto, body))

describe('MergeUsersDto', () => {
  it('accepts a source user id', async () => {
    expect(await validateDto({ sourceUserId: 'user-2' })).toHaveLength(0)
  })

  it.each([{}, { sourceUserId: '' }, { sourceUserId: 42 }, { sourceUserId: null }])(
    'rejects %p',
    async (body) => {
      expect(await validateDto(body)).not.toHaveLength(0)
    },
  )
})
