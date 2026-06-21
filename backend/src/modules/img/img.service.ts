import { Buffer } from 'node:buffer'
import { createHash } from 'node:crypto'
import { BadRequestException, Injectable, Logger } from '@nestjs/common'
import { S3Service } from '@/modules/s3/s3.service'
import { env } from '@/utils/enviroments'

@Injectable()
export class ImgService {
  private readonly logger = new Logger(ImgService.name)

  constructor(private readonly s3Service: S3Service) {}

  async getImageContent(urlBase64: string) {
    const originalUrl = Buffer.from(urlBase64, 'base64').toString('utf-8')
    const urlHash = createHash('sha256').update(originalUrl).digest('hex')
    const key = `${urlHash}.webp`

    try {
      if (await this.s3Service.fileExists(key, env.S3_BUCKET_IMAGES)) {
        this.logger.log(`S3 cache hit: ${key}`)
        const buffer = await this.s3Service.getFileBytes(key, env.S3_BUCKET_IMAGES)
        return { buffer, contentType: 'image/webp' }
      }
    } catch (e) {
      this.logger.warn(`S3 cache miss: ${key}`)
      this.logger.error(e)
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
        await this.s3Service.uploadFile(
          key,
          Buffer.from(imageBytes),
          env.S3_BUCKET_IMAGES,
          'image/webp',
        )
        this.logger.log(`S3 cache write: ${key}`)
      } catch (e) {
        this.logger.warn('Failed to cache image in S3')
        this.logger.error(e)
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
