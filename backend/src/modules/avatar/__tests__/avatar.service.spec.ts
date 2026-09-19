import { describe, expect, it, mock } from 'bun:test'
import { BadRequestException } from '@nestjs/common'
import sharp from 'sharp'
import { createMock } from '@/__tests__/helpers/mock-factory'
import { S3Service } from '@/modules/s3/s3.service'
import { env } from '@/utils/enviroments'
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

describe('AvatarService.processAndStoreAvatar', () => {
  const makeService = () => {
    const s3 = createMock(S3Service)
    s3.uploadFile = mock(() => Promise.resolve()) as any
    return { service: new AvatarService(s3), s3 }
  }

  it('rejects a non-image buffer', async () => {
    const { service } = makeService()

    await expect(
      service.processAndStoreAvatar('user-1', Buffer.from('not an image')),
    ).rejects.toThrow(BadRequestException)
  })

  it('rejects an unsupported format', async () => {
    const { service } = makeService()
    const tiff = await sharp({
      create: { width: 10, height: 10, channels: 3, background: 'red' },
    })
      .tiff()
      .toBuffer()

    await expect(service.processAndStoreAvatar('user-1', tiff)).rejects.toThrow(BadRequestException)
  })

  it('rejects images above the pixel limit', async () => {
    const { service } = makeService()
    const bomb = Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" width="100000" height="100000"></svg>',
    )

    await expect(service.processAndStoreAvatar('user-1', bomb)).rejects.toThrow(BadRequestException)
  })

  it('stores a valid png as webp', async () => {
    const { service, s3 } = makeService()
    const png = await sharp({
      create: { width: 10, height: 10, channels: 3, background: 'red' },
    })
      .png()
      .toBuffer()

    const url = await service.processAndStoreAvatar('user-1', png)

    expect(url).toContain('/api/avatar/user-1')
    expect(s3.uploadFile).toHaveBeenCalledWith(
      'user-1.webp',
      expect.any(Buffer),
      env.S3_BUCKET_AVATARS,
      'image/webp',
    )
  })

  it('accepts the generated default svg avatar', async () => {
    const { service } = makeService()

    await expect(
      service.processAndStoreAvatar('user-1', buildDefaultAvatarSvg('user-1', 'ivan')),
    ).resolves.toContain('/api/avatar/user-1')
  })
})
