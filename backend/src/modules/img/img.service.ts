import { Buffer } from 'node:buffer'
import { createHash } from 'node:crypto'
import { stat } from 'node:fs/promises'
import path from 'node:path'
import process, { env } from 'node:process'
import { BadRequestException, Injectable } from '@nestjs/common'
import sharp from 'sharp'

@Injectable()
export class ImgService {
  async getImageContent(urlBase64: string) {
    const originalUrl = Buffer.from(urlBase64, 'base64').toString('utf-8')

    const urlHash = createHash('sha256').update(originalUrl).digest('hex')
    const fileDiskPath = path.resolve(process.cwd(), 'images', `${urlHash}.webp`)

    const isFileExists = await stat(fileDiskPath).then(() => true).catch(() => false)
    if (isFileExists) {
      return {
        fileDiskPath,
        contentType: 'image/webp',
      }
    }

    try {
      const response = await fetch(originalUrl, { proxy: env.PROXY })
      if (!response.ok) {
        throw new BadRequestException(`Failed to fetch image: ${response.status}`)
      }

      const contentType = response.headers.get('content-type')
      if (!contentType?.startsWith('image/')) {
        throw new BadRequestException('URL does not point to an image')
      }

      const fileContent = await response.arrayBuffer()

      const imageBuffer = await sharp(fileContent)
        .resize(300, 450)
        .webp()
        .toBuffer()

      await Bun.write(fileDiskPath, imageBuffer)

      return {
        fileDiskPath,
        contentType: 'image/webp',
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error
      }
      throw new BadRequestException(`Failed to process image: ${error.message}`)
    }
  }
}
