import { describe, expect, it } from 'bun:test'
import { platformEnum } from '@gmd/database/schema'
import { BadRequestException, ParseEnumPipe } from '@nestjs/common'
import { AccountPlatform } from '@/enums'

describe('AccountPlatform', () => {
  it('matches the database enum values', () => {
    expect(Object.values(AccountPlatform)).toEqual(platformEnum.enumValues)
  })

  const pipe = new ParseEnumPipe(AccountPlatform)
  const metadata = { type: 'param' } as any
  const transform = (value: string) =>
    pipe.transform(value, metadata) as unknown as Promise<string | undefined>

  it('accepts known platforms', async () => {
    await expect(transform('TWITCH')).resolves.toBe('TWITCH')
    await expect(transform('KICK')).resolves.toBe('KICK')
    await expect(transform('TELEGRAM')).resolves.toBe('TELEGRAM')
  })

  it('rejects unknown platforms', async () => {
    await expect(transform('STEAM')).rejects.toThrow(BadRequestException)
  })
})
