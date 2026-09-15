import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { Buffer } from 'node:buffer'
import { createHash } from 'node:crypto'
import sharp from 'sharp'
import { createMock } from '@/__tests__/helpers/mock-factory'
import { S3Service } from '@/modules/s3/s3.service'
import { env } from '@/utils/enviroments'
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

function installFetch(bytes: Buffer, contentType = 'image/jpeg') {
  const originalFetch = globalThis.fetch
  const fetchMock = mock(() =>
    Promise.resolve({
      ok: true,
      headers: { get: (name: string) => (name === 'content-type' ? contentType : null) },
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
        const result = await service.getImageContent(toBase64('https://example.com/a.jpg'))

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
      const url = 'https://example.com/poster.jpg'
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
        await service.getImageContent(toBase64('https://example.com/poster.jpg'))
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
  })
})
