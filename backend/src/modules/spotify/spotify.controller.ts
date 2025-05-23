import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common'
import { $Enums } from '@prisma/client'
import { AuthGuard } from '../auth/auth.guard'
import { RolesGuard } from '../auth/auth.roles.guard'
import { SpotifyService } from './spotify.service'

@Controller('/auth/spotify')
@UseGuards(AuthGuard, new RolesGuard([$Enums.UserRole.ADMIN]))
export class SpotifyController {
  constructor(private readonly service: SpotifyService) {}

  @Get()
  getAuthLink() {
    return this.service.createAuthorizationUrl()
  }

  @Post()
  async performAuthorization(@Query('code') code: string) {
    await this.service.authorize(code)
  }
}
