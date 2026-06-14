import { Controller, Get, Header, Post, Query, UseGuards } from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import { UserRole } from '@/enums'
import { AuthGuard } from '@/modules/auth/auth.guard'
import { RolesGuard } from '@/modules/auth/auth.roles.guard'
import { SpotifyService } from '@/modules/spotify/spotify.service'
import { THROTTLER_LIMITS } from '@/utils/throttler'

@Controller('/auth/spotify')
@UseGuards(AuthGuard, new RolesGuard([UserRole.ADMIN]))
@Throttle({ default: THROTTLER_LIMITS.spotify })
export class SpotifyController {
  constructor(private readonly service: SpotifyService) {}

  @Get()
  @Header('Content-Type', 'text/plain')
  getAuthLink() {
    return this.service.createAuthorizationUrl()
  }

  @Post()
  async performAuthorization(@Query('code') code: string) {
    await this.service.authorize(code)
  }
}
