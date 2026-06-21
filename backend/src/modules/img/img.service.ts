import { Buffer } from 'node:buffer'
import { createHash } from 'node:crypto'
import { BadRequestException, Injectable, Logger } from '@nestjs/common'
import { env } from '@/utils/enviroments'

@Injectable()
export class ImgService {
  private readonly logger = new Logger(ImgService.name)
  private readonly s3 = new Bun.S3Client({
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    endpoint: env.R2_ENDPOINT,
    bucket: 'images',
  })

  async getImageContent(urlBase64: string) {
    const originalUrl = Buffer.from(urlBase64, 'base64').toString('utf-8')
    const urlHash = createHash('sha256').update(originalUrl).digest('hex')
    const key = `${urlHash}.webp`

    const s3file = this.s3.file(key)

    try {
      if (await s3file.exists()) {
        this.logger.log(`R2 cache hit: ${key}`)
        const bytes = await s3file.bytes()
        return { buffer: Buffer.from(bytes), contentType: 'image/webp' }
      }
    } catch (e) {
      this.logger.warn(`R2 cache miss: ${key} — ${e.message}`)
    }

    try {
      const proxyBase = env.PROXY
      const fetchUrl = proxyBase
        ? `${proxyBase}${proxyBase.includes('?') ? '&' : '?'}url=${encodeURIComponent(originalUrl)}`
        : originalUrl

      const defaultHeaders = { 'User-Agent': 'Mozilla/5.0' }
      let response
      try {
        response = await fetch(fetchUrl, { headers: defaultHeaders })
      } catch (err) {
        if (proxyBase) {
          try {
            response = await fetch(originalUrl, { headers: defaultHeaders })
          } catch (err2) {
            this.logger.error(`Failed to fetch image from original url: ${err2.message}`)
            throw new BadRequestException(`Failed to fetch image: ${err2.message}`)
          }
        } else {
          this.logger.error(`Failed to fetch image: ${err.message}`)
          throw new BadRequestException(`Failed to fetch image: ${err.message}`)
        }
      }

      if (!response.ok) {
        if (proxyBase) {
          const fallback = await fetch(originalUrl, { headers: defaultHeaders }).catch(() => null)
          if (fallback && fallback.ok) {
            response = fallback
          } else {
            throw new BadRequestException(`Failed to fetch image: ${response.status}`)
          }
        } else {
          throw new BadRequestException(`Failed to fetch image: ${response.status}`)
        }
      }

      const contentType = response.headers.get('content-type')
      if (!contentType?.startsWith('image/')) {
        this.logger.warn(`URL does not point to an image content-type=${contentType}`)
        throw new BadRequestException('URL does not point to an image')
      }

      const fileContent = await response.arrayBuffer()
      const imageBytes = await new Bun.Image(fileContent).resize(300, 450).webp().bytes()

      try {
        await s3file.write(imageBytes, { type: 'image/webp' })
        this.logger.log(`R2 cache write: ${key}`)
      } catch (e) {
        this.logger.warn(`Failed to cache image in R2: ${e.message}`)
      }

      return { buffer: Buffer.from(imageBytes), contentType: 'image/webp' }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error
      }
      throw new BadRequestException(`Failed to process image: ${error.message}`)
    }
  }
}
