import { Module } from '@nestjs/common'
import { ImgController } from '@/modules/img/img.controller'
import { ImgService } from '@/modules/img/img.service'
import { S3Module } from '@/modules/s3/s3.module'

@Module({
  imports: [S3Module],
  controllers: [ImgController],
  providers: [ImgService],
  exports: [ImgService],
})
export class ImgModule {}
