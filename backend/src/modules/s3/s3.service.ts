import { Injectable, Logger } from '@nestjs/common'
import { env } from '@/utils/enviroments'

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name)
  private readonly client = new Bun.S3Client({
    accessKeyId: env.S3_ACCESS_KEY_ID,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY,
    endpoint: env.S3_ENDPOINT,
  })

  async uploadFile(
    key: string,
    buffer: Buffer,
    bucket: string,
    contentType: string,
  ): Promise<void> {
    const file = this.client.file(key, { bucket })
    await file.write(buffer, { type: contentType })
    this.logger.log(`S3 upload: ${bucket}/${key}`)
  }

  async deleteFile(key: string, bucket: string): Promise<void> {
    const file = this.client.file(key, { bucket })
    await file.delete()
    this.logger.log(`S3 delete: ${bucket}/${key}`)
  }

  async fileExists(key: string, bucket: string): Promise<boolean> {
    const file = this.client.file(key, { bucket })
    return await file.exists()
  }

  async getFileBytes(key: string, bucket: string): Promise<Buffer> {
    const file = this.client.file(key, { bucket })
    const bytes = await file.bytes()
    return Buffer.from(bytes)
  }
}
