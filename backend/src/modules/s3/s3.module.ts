import { Module } from '@nestjs/common'
import { S3Service } from '@/modules/s3/s3.service'

@Module({
  providers: [S3Service],
  exports: [S3Service],
})
export class S3Module {}
