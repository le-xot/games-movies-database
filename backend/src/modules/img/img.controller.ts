import { Controller, Get, Query, Res } from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import { ImgService } from '@/modules/img/img.service'
import { THROTTLER_LIMITS } from '@/utils/throttler'
import type { Response } from 'express'

@Controller('img')
export class ImgController {
  constructor(private readonly imgService: ImgService) {}

  @Get()
  @Throttle({ default: THROTTLER_LIMITS.img })
  async getImageContent(@Query('urlEncoded') urlEncoded: string, @Res() res: Response) {
    const { buffer, contentType } = await this.imgService.getImageContent(urlEncoded)

    res.setHeader('Content-Type', contentType)
    res.setHeader('Content-Length', buffer.length.toString())
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
    res.setHeader('ETag', `"${urlEncoded}"`)

    res.end(buffer)
  }
}
