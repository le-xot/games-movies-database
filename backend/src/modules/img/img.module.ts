import { Module } from "@nestjs/common"
import { ImgController } from "./img.controller"
import { ImgService } from "./img.service"

@Module({
  controllers: [ImgController],
  providers: [ImgService],
})
export class ImgModule {}
