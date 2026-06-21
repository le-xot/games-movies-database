import { Controller, Get, Param, Res } from '@nestjs/common'
import { AvatarService } from '@/modules/avatar/avatar.service'
import type { Response } from 'express'

@Controller('avatar')
export class AvatarController {
  constructor(private readonly avatarService: AvatarService) {}

  @Get(':userId')
  async getAvatar(@Param('userId') userId: string, @Res() res: Response) {
    const buffer = await this.avatarService.getAvatarBuffer(userId)

    if (!buffer) {
      res.status(404).end()
      return
    }

    res.setHeader('Content-Type', 'image/webp')
    res.setHeader('Content-Length', buffer.length.toString())
    res.setHeader('Cache-Control', 'public, max-age=86400')
    res.end(buffer)
  }
}
