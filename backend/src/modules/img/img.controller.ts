import { Buffer } from 'node:buffer'
import { Controller, Get, Query, Res } from '@nestjs/common'
import { ImgService } from './img.service'
import type { Response } from 'express'

@Controller('img')
export class ImgController {
  constructor(private readonly imgService: ImgService) {}

  @Get()
  async getImageContent(@Query('urlEncoded') urlEncoded: string, @Res() res: Response) {
    const { fileDiskPath, contentType } = await this.imgService.getImageContent(urlEncoded)

    const file = Bun.file(fileDiskPath)
    const fileBuffer = await file.arrayBuffer()

    res.setHeader('Content-Type', contentType)
    res.setHeader('Content-Length', fileBuffer.byteLength.toString())
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
    res.setHeader('ETag', `"${urlEncoded}"`)

    res.end(Buffer.from(fileBuffer))
  }
}
