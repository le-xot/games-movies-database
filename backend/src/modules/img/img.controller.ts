import { Controller, Get, Query, Res } from "@nestjs/common";
import { ImgService } from "./img.service";
import type { Response } from "express";

@Controller('img')
export class ImgController {
  constructor(private readonly imgService: ImgService) {}

  @Get()
  async getImageContent(@Query('urlEncoded') urlEncoded: string, @Res() res: Response) {
    const { fileDiskPath, contentType } = await this.imgService.getImageContent(urlEncoded);

    res.setHeader('Content-Type', contentType);


    res.sendFile(fileDiskPath)
  }
}
