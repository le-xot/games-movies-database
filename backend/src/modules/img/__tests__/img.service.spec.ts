import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { Buffer } from 'node:buffer'
import { createHash } from 'node:crypto'
import { BadRequestException } from '@nestjs/common'
import sharp from 'sharp'
import { createMock } from '@/__tests__/helpers/mock-factory'
import { S3Service } from '@/modules/s3/s3.service'
import { env } from '@/utils/enviroments'
import { MAX_IMAGE_BYTES } from '../img-url-safety'
import { ImgVariant } from '../img.dto'
import { ImgService } from '../img.service'

const svgFixture = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="180">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#1e3a8a"/>
      <stop offset="0.5" stop-color="#ef4444"/>
      <stop offset="1" stop-color="#f59e0b"/>
    </linearGradient>
  </defs>
  <rect width="120" height="180" fill="url(#g)"/>
  <circle cx="60" cy="60" r="42" fill="#0ea5e9"/>
  <rect x="20" y="120" width="80" height="30" fill="#111827"/>
</svg>`

function makeImageFixture(): Promise<Buffer> {
  return sharp(Buffer.from(svgFixture)).jpeg({ quality: 92 }).toBuffer()
}

function installFetch(
  bytes: Buffer,
  contentType = 'image/jpeg',
  contentLength: string | null = null,
) {
  const originalFetch = globalThis.fetch
  const fetchMock = mock(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      headers: {
        get: (name: string) => {
          if (name === 'content-type') return contentType
          if (name === 'content-length') return contentLength
          return null
        },
      },
      arrayBuffer: () => Promise.resolve(bytes),
    } as any),
  )
  globalThis.fetch = fetchMock as any
  return {
    fetchMock,
    restore: () => {
      globalThis.fetch = originalFetch
    },
  }
}

const toBase64 = (url: string) => Buffer.from(url).toString('base64')
const cacheKey = (url: string) => `${createHash('sha256').update(url).digest('hex')}.webp`

describe('ImgService', () => {
  let service: ImgService
  let mockS3: S3Service
  let fixture: Buffer

  beforeEach(async () => {
    mockS3 = createMock(S3Service)
    service = new ImgService(mockS3)
    fixture = await makeImageFixture()
  })

  describe('getImageContent', () => {
    it('returns the cached image from S3 without fetching the source', async () => {
      const cached = Buffer.from('cached-webp-bytes')
      mockS3.fileExists = mock(() => Promise.resolve(true))
      mockS3.getFileBytes = mock(() => Promise.resolve(cached))
      const { fetchMock, restore } = installFetch(fixture)

      try {
        const result = await service.getImageContent(toBase64('https://93.184.216.34/a.jpg'))

        expect(result).toEqual({ buffer: cached, contentType: 'image/webp' })
        expect(fetchMock).not.toHaveBeenCalled()
        expect(mockS3.uploadFile).not.toHaveBeenCalled()
      } finally {
        restore()
      }
    })

    it('re-encodes a fetched poster to a 300x450 webp in the images bucket', async () => {
      mockS3.fileExists = mock(() => Promise.resolve(false))
      mockS3.uploadFile = mock(() => Promise.resolve()) as any
      const url = 'https://93.184.216.34/poster.jpg'
      const { restore } = installFetch(fixture)

      try {
        const result = await service.getImageContent(toBase64(url))

        expect(result.contentType).toBe('image/webp')
        const meta = await new Bun.Image(result.buffer).metadata()
        expect(meta.width).toBe(300)
        expect(meta.height).toBe(450)
        expect(mockS3.uploadFile).toHaveBeenCalledWith(
          cacheKey(url),
          expect.any(Buffer),
          env.S3_BUCKET_IMAGES,
          'image/webp',
        )
      } finally {
        restore()
      }
    })

    it('encodes the poster at webp quality 65', async () => {
      mockS3.fileExists = mock(() => Promise.resolve(false))
      let uploaded: Buffer | undefined
      mockS3.uploadFile = mock((_key, buffer) => {
        uploaded = buffer
        return Promise.resolve()
      }) as any
      const { restore } = installFetch(fixture)

      try {
        await service.getImageContent(toBase64('https://93.184.216.34/poster.jpg'))
      } finally {
        restore()
      }

      const expected = Buffer.from(
        await new Bun.Image(fixture).resize(300, 450).webp({ quality: 65 }).bytes(),
      )
      const quality80 = Buffer.from(
        await new Bun.Image(fixture).resize(300, 450).webp({ quality: 80 }).bytes(),
      )

      expect(uploaded).toEqual(expected)
      expect(uploaded!.length).toBeLessThan(quality80.length)
    })

    it('re-encodes a fetched avatar to a 64x64 webp', async () => {
      mockS3.fileExists = mock(() => Promise.resolve(false))
      mockS3.uploadFile = mock(() => Promise.resolve()) as any
      const url = 'https://93.184.216.34/avatar.jpg'
      const { restore } = installFetch(fixture)

      try {
        const result = await service.getImageContent(toBase64(url), ImgVariant.AVATAR)

        expect(result.contentType).toBe('image/webp')
        const meta = await new Bun.Image(result.buffer).metadata()
        expect(meta.width).toBe(64)
        expect(meta.height).toBe(64)
        expect(mockS3.uploadFile).toHaveBeenCalledWith(
          `${createHash('sha256').update(url).digest('hex')}_avatar.webp`,
          expect.any(Buffer),
          env.S3_BUCKET_IMAGES,
          'image/webp',
        )
      } finally {
        restore()
      }
    })

    it('looks up the avatar cache key', async () => {
      mockS3.fileExists = mock(() => Promise.resolve(true))
      mockS3.getFileBytes = mock(() => Promise.resolve(Buffer.from('cached')))
      const url = 'https://93.184.216.34/avatar.jpg'
      const { restore } = installFetch(fixture)

      try {
        await service.getImageContent(toBase64(url), ImgVariant.AVATAR)

        expect(mockS3.fileExists).toHaveBeenCalledWith(
          `${createHash('sha256').update(url).digest('hex')}_avatar.webp`,
          env.S3_BUCKET_IMAGES,
        )
      } finally {
        restore()
      }
    })

    it('encodes avatars at webp quality 80', async () => {
      mockS3.fileExists = mock(() => Promise.resolve(false))
      let uploaded: Buffer | undefined
      mockS3.uploadFile = mock((_key, buffer) => {
        uploaded = buffer
        return Promise.resolve()
      }) as any
      const { restore } = installFetch(fixture)

      try {
        await service.getImageContent(
          toBase64('https://93.184.216.34/avatar.jpg'),
          ImgVariant.AVATAR,
        )
      } finally {
        restore()
      }

      const expected = Buffer.from(
        await new Bun.Image(fixture).resize(64, 64).webp({ quality: 80 }).bytes(),
      )

      expect(uploaded).toEqual(expected)
    })

    it('rejects URLs that are not public http(s)', async () => {
      mockS3.fileExists = mock(() => Promise.resolve(false))
      const { restore } = installFetch(fixture)

      try {
        await expect(service.getImageContent(toBase64('file:///etc/passwd'))).rejects.toThrow(
          BadRequestException,
        )
        await expect(service.getImageContent(toBase64('http://127.0.0.1/a.jpg'))).rejects.toThrow(
          BadRequestException,
        )
      } finally {
        restore()
      }
    })

    it('rejects images larger than the size limit', async () => {
      mockS3.fileExists = mock(() => Promise.resolve(false))
      const { restore } = installFetch(fixture, 'image/jpeg', String(MAX_IMAGE_BYTES + 1))

      try {
        await expect(
          service.getImageContent(toBase64('https://93.184.216.34/huge.jpg')),
        ).rejects.toThrow(BadRequestException)
      } finally {
        restore()
      }
    })

    it('rejects images above the pixel limit', async () => {
      mockS3.fileExists = mock(() => Promise.resolve(false))
      const big = await sharp({
        create: { width: 5001, height: 5000, channels: 3, background: 'red' },
      })
        .png()
        .toBuffer()
      const { restore } = installFetch(big, 'image/png')

      try {
        await expect(
          service.getImageContent(toBase64('https://93.184.216.34/big.png')),
        ).rejects.toThrow(BadRequestException)
      } finally {
        restore()
      }
    })
  })
})
