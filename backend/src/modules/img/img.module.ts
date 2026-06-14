import { Module } from '@nestjs/common'
import { ImgController } from '@/modules/img/img.controller'
import { ImgService } from '@/modules/img/img.service'

@Module({
  controllers: [ImgController],
  providers: [ImgService],
})
export class ImgModule {}
