import { Injectable, Logger } from '@nestjs/common'
import sharp from 'sharp'
import { S3Service } from '@/modules/s3/s3.service'
import { env } from '@/utils/enviroments'

const AVATAR_SIZE = 256
const AVATAR_QUALITY = 80
const ACCEPTED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

@Injectable()
export class AvatarService {
  private readonly logger = new Logger(AvatarService.name)

  constructor(private readonly s3Service: S3Service) {}

  static isAcceptedMimeType(mimetype: string): boolean {
    return ACCEPTED_MIME_TYPES.includes(mimetype)
  }

  async processAndStoreAvatar(userId: string, imageBuffer: Buffer): Promise<string> {
    const processed = await sharp(imageBuffer)
      .resize(AVATAR_SIZE, AVATAR_SIZE, { fit: 'cover', position: 'center' })
      .webp({ quality: AVATAR_QUALITY })
      .toBuffer()

    const key = `${userId}.webp`
    await this.s3Service.uploadFile(key, processed, env.S3_BUCKET_AVATARS, 'image/webp')
    this.logger.log(`Avatar stored: ${key}`)

    return `/api/avatar/${userId}?t=${Date.now()}`
  }

  async deleteAvatarFromS3(userId: string): Promise<void> {
    const key = `${userId}.webp`
    try {
      await this.s3Service.deleteFile(key, env.S3_BUCKET_AVATARS)
      this.logger.log(`Avatar deleted: ${key}`)
    } catch (e) {
      this.logger.warn(`Failed to delete avatar: ${key}`)
      this.logger.error(e)
    }
  }

  async getAvatarBuffer(userId: string): Promise<Buffer | null> {
    const key = `${userId}.webp`
    try {
      const exists = await this.s3Service.fileExists(key, env.S3_BUCKET_AVATARS)
      if (!exists) return null
      return await this.s3Service.getFileBytes(key, env.S3_BUCKET_AVATARS)
    } catch {
      return null
    }
  }

  async fetchAndStoreOAuthAvatar(userId: string, oauthUrl: string): Promise<string | null> {
    try {
      const response = await fetch(oauthUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } })
      if (!response.ok) return null

      const contentType = response.headers.get('content-type')
      if (!contentType?.startsWith('image/')) return null

      const buffer = Buffer.from(await response.arrayBuffer())
      return await this.processAndStoreAvatar(userId, buffer)
    } catch (e) {
      this.logger.warn(`Failed to fetch OAuth avatar: ${oauthUrl}`)
      this.logger.error(e)
      return null
    }
  }
}
