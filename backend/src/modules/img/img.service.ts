import { Buffer } from 'node:buffer'
import { createHash } from 'node:crypto'
import { GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { BadRequestException, Injectable, Logger } from '@nestjs/common'
import sharp from 'sharp'
import { env } from '@/utils/enviroments'

@Injectable()
export class ImgService {
  private readonly logger = new Logger(ImgService.name)
  private readonly s3 = new S3Client({
    region: 'auto',
    endpoint: env.R2_ENDPOINT,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    },
  })
  private readonly bucket = 'images'

  async getImageContent(urlBase64: string) {
    const originalUrl = Buffer.from(urlBase64, 'base64').toString('utf-8')
    const urlHash = createHash('sha256').update(originalUrl).digest('hex')
    const key = `${urlHash}.webp`

    try {
      await this.s3.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }))
      const obj = await this.s3.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }))
      const buffer = Buffer.from(await obj.Body.transformToByteArray())
      return { buffer, contentType: 'image/webp' }
    } catch {
      // cache miss — continue to fetch
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
      const imageBuffer = await sharp(fileContent).resize(300, 450).webp().toBuffer()

      await this.s3.send(new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: imageBuffer,
        ContentType: 'image/webp',
      }))

      return { buffer: imageBuffer, contentType: 'image/webp' }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error
      }
      throw new BadRequestException(`Failed to process image: ${error.message}`)
    }
  }
}
