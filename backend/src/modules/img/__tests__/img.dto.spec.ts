import { describe, expect, it } from 'bun:test'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { GetImageQueryDTO, ImgVariant } from '../img.dto'

const validateQuery = (query: Record<string, unknown>) =>
  validate(plainToInstance(GetImageQueryDTO, query))

describe('GetImageQueryDTO', () => {
  it('accepts urlEncoded without a variant', async () => {
    expect(
      await validateQuery({ urlEncoded: 'aHR0cHM6Ly9leGFtcGxlLmNvbS9hLmpwZw==' }),
    ).toHaveLength(0)
  })

  it.each(Object.values(ImgVariant))('accepts variant=%s', async (variant) => {
    expect(
      await validateQuery({ urlEncoded: 'aHR0cHM6Ly9leGFtcGxlLmNvbS9hLmpwZw==', variant }),
    ).toHaveLength(0)
  })

  it('rejects a missing urlEncoded', async () => {
    expect(await validateQuery({ variant: ImgVariant.AVATAR })).not.toHaveLength(0)
  })

  it.each(['64', 'POSTER', 'garbage'])('rejects variant=%s', async (variant) => {
    expect(
      await validateQuery({ urlEncoded: 'aHR0cHM6Ly9leGFtcGxlLmNvbS9hLmpwZw==', variant }),
    ).not.toHaveLength(0)
  })
})
