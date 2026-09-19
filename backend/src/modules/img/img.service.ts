import { Buffer } from 'node:buffer'
import { createHash } from 'node:crypto'
import { BadRequestException, Injectable, Logger } from '@nestjs/common'
import {
  assertPublicHttpUrl,
  fetchPublicImage,
  MAX_IMAGE_BYTES,
} from '@/modules/img/img-url-safety'
import { S3Service } from '@/modules/s3/s3.service'
import { env } from '@/utils/enviroments'

const POSTER_WIDTH = 300
const POSTER_HEIGHT = 450
const POSTER_QUALITY = 65

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
      await assertPublicHttpUrl(originalUrl)

      const defaultHeaders = { 'User-Agent': 'Mozilla/5.0' }
      const proxyBase = env.PROXY
      let response: Response

      if (proxyBase) {
        const fetchUrl = `${proxyBase}${proxyBase.includes('?') ? '&' : '?'}url=${encodeURIComponent(originalUrl)}`
        const proxyResponse = await fetch(fetchUrl, { headers: defaultHeaders }).catch(() => null)
        response =
          proxyResponse?.ok === true
            ? proxyResponse
            : await fetchPublicImage(originalUrl, { headers: defaultHeaders })
      } else {
        response = await fetchPublicImage(originalUrl, { headers: defaultHeaders })
      }

      if (!response.ok) {
        throw new BadRequestException(`Failed to fetch image: ${response.status}`)
      }

      const contentType = response.headers.get('content-type')
      if (!contentType?.startsWith('image/')) {
        this.logger.warn(`URL does not point to an image content-type=${contentType}`)
        throw new BadRequestException('URL does not point to an image')
      }

      const declaredLength = Number(response.headers.get('content-length') ?? '0')
      if (declaredLength > MAX_IMAGE_BYTES) {
        throw new BadRequestException('Image is too large')
      }

      const fileContent = await response.arrayBuffer()
      if (fileContent.byteLength > MAX_IMAGE_BYTES) {
        throw new BadRequestException('Image is too large')
      }

      const imageBytes = await new Bun.Image(fileContent)
        .resize(POSTER_WIDTH, POSTER_HEIGHT)
        .webp({ quality: POSTER_QUALITY })
        .bytes()

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
