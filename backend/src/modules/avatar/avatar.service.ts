import crypto from 'node:crypto'
import { BadRequestException, Injectable, Logger } from '@nestjs/common'
import sharp from 'sharp'
import { S3Service } from '@/modules/s3/s3.service'
import { env } from '@/utils/enviroments'
import { assertPixelLimit, MAX_IMAGE_PIXELS } from '@/utils/image-limits'

const AVATAR_SIZE = 256
const AVATAR_QUALITY = 80
const ALLOWED_AVATAR_FORMATS = new Set(['jpeg', 'png', 'webp', 'gif', 'avif', 'svg'])

export const AVATAR_PALETTE = [
  '#5865F2',
  '#7C3AED',
  '#DB2777',
  '#DC2626',
  '#EA580C',
  '#16A34A',
  '#0891B2',
  '#2563EB',
  '#4F46E5',
  '#9333EA',
]

export function pickAvatarColor(userId: string): string {
  const digest = crypto.createHash('sha256').update(userId).digest()
  return AVATAR_PALETTE[digest[0] % AVATAR_PALETTE.length]
}

export function buildDefaultAvatarSvg(userId: string, login: string): Buffer {
  const letter = Array.from(login.trim())[0]?.toUpperCase() ?? '?'
  const escapedLetter = letter
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${AVATAR_SIZE}" height="${AVATAR_SIZE}">` +
    `<rect width="${AVATAR_SIZE}" height="${AVATAR_SIZE}" fill="${pickAvatarColor(userId)}"/>` +
    `<text x="50%" y="50%" dy="0.35em" text-anchor="middle" font-family="DejaVu Sans, Arial, sans-serif" font-size="${AVATAR_SIZE / 2}" font-weight="bold" fill="#ffffff">${escapedLetter}</text>` +
    `</svg>`

  return Buffer.from(svg)
}

@Injectable()
export class AvatarService {
  private readonly logger = new Logger(AvatarService.name)

  constructor(private readonly s3Service: S3Service) {}

  async processAndStoreAvatar(userId: string, imageBuffer: Buffer): Promise<string> {
    const metadata = await this.readMetadata(imageBuffer)
    if (!metadata.format || !ALLOWED_AVATAR_FORMATS.has(metadata.format)) {
      throw new BadRequestException('Unsupported image format')
    }
    assertPixelLimit(metadata.width ?? 0, metadata.height ?? 0)

    const processed = await sharp(imageBuffer, { limitInputPixels: MAX_IMAGE_PIXELS })
      .resize(AVATAR_SIZE, AVATAR_SIZE, { fit: 'cover', position: 'center' })
      .webp({ quality: AVATAR_QUALITY })
      .toBuffer()

    const key = `${userId}.webp`
    await this.s3Service.uploadFile(key, processed, env.S3_BUCKET_AVATARS, 'image/webp')
    this.logger.log(`Avatar stored: ${key}`)

    return `/api/avatar/${userId}?t=${Date.now()}`
  }

  private async readMetadata(imageBuffer: Buffer) {
    try {
      return await sharp(imageBuffer, { limitInputPixels: MAX_IMAGE_PIXELS }).metadata()
    } catch {
      throw new BadRequestException('Invalid image file')
    }
  }

  async generateAndStoreDefaultAvatar(userId: string, login: string): Promise<string> {
    return await this.processAndStoreAvatar(userId, buildDefaultAvatarSvg(userId, login))
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
}
