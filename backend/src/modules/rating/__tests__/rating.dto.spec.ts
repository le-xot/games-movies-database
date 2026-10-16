import { describe, expect, it } from 'bun:test'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { RecordGrade } from '@/enums'
import { RatingUpsertDTO } from '../rating.dto'

const validateBody = (body: Record<string, unknown>) =>
  validate(plainToInstance(RatingUpsertDTO, body))

describe('RatingUpsertDTO', () => {
  it.each(Object.values(RecordGrade))('accepts grade=%s', async (grade) => {
    expect(await validateBody({ grade })).toHaveLength(0)
  })

  it.each(['LIKEE', '', 5, null, undefined])('rejects grade=%s', async (grade) => {
    expect(await validateBody({ grade })).not.toHaveLength(0)
  })

  it('rejects an empty body', async () => {
    expect(await validateBody({})).not.toHaveLength(0)
  })
})
