import { describe, expect, it, mock } from 'bun:test'
import { createMock } from '@/__tests__/helpers/mock-factory'
import { S3Service } from '@/modules/s3/s3.service'
import {
  AVATAR_PALETTE,
  AvatarService,
  buildDefaultAvatarSvg,
  pickAvatarColor,
} from '../avatar.service'

describe('AvatarService default avatar', () => {
  it('picks a stable palette color for the same user id', () => {
    expect(pickAvatarColor('user-1')).toBe(pickAvatarColor('user-1'))
    expect(AVATAR_PALETTE).toContain(pickAvatarColor('user-1'))
    expect(AVATAR_PALETTE).toContain(pickAvatarColor('user-2'))
  })

  it('builds an svg with the uppercase first letter and palette color', () => {
    const svg = buildDefaultAvatarSvg('user-1', 'ivan').toString()
    expect(svg).toContain('>I</text>')
    expect(svg).toContain(pickAvatarColor('user-1'))
  })

  it('supports cyrillic logins and escapes xml', () => {
    expect(buildDefaultAvatarSvg('user-2', 'иван').toString()).toContain('>И</text>')
    expect(buildDefaultAvatarSvg('user-3', '<bob').toString()).toContain('>&lt;</text>')
  })

  it('falls back to ? for an empty login', () => {
    expect(buildDefaultAvatarSvg('user-4', '').toString()).toContain('>?</text>')
  })

  it('stores the svg through processAndStoreAvatar', async () => {
    const service = new AvatarService(createMock(S3Service))
    const store = mock(() => Promise.resolve('/api/avatar/user-1?t=1'))
    service.processAndStoreAvatar = store as unknown as AvatarService['processAndStoreAvatar']

    const result = await service.generateAndStoreDefaultAvatar('user-1', 'ivan')

    expect(result).toBe('/api/avatar/user-1?t=1')
    expect(store).toHaveBeenCalledWith('user-1', expect.any(Buffer))
    const buffer = (store.mock.calls[0] as unknown as [string, Buffer])[1]
    expect(buffer.toString()).toContain('>I</text>')
  })
})
