import { createHash } from 'node:crypto'
import { Controller, Get, Query, Res } from '@nestjs/common'
import { GetImageQueryDTO, ImgVariant } from '@/modules/img/img.dto'
import { ImgService } from '@/modules/img/img.service'
import { RateLimit } from '@/modules/rate-limit/rate-limit.decorator'
import { RATE_LIMITS } from '@/utils/rate-limits'
import type { Response } from 'express'

@Controller('img')
export class ImgController {
  constructor(private readonly imgService: ImgService) {}

  @Get()
  @RateLimit(RATE_LIMITS.img)
  async getImageContent(@Query() query: GetImageQueryDTO, @Res() res: Response) {
    const variant = query.variant ?? ImgVariant.POSTER
    const { buffer, contentType } = await this.imgService.getImageContent(query.urlEncoded, variant)
    const etagSource = `${query.urlEncoded}:${variant}`

    res.setHeader('Content-Type', contentType)
    res.setHeader('Content-Length', buffer.length.toString())
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
    res.setHeader('ETag', `"${createHash('sha256').update(etagSource).digest('hex')}"`)

    res.end(buffer)
  }
}
