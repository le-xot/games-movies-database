import { Controller, Get, Header, Post, Query, UseGuards } from '@nestjs/common'
import { UserRole } from '@/enums'
import { AuthGuard } from '@/modules/auth/auth.guard'
import { RolesGuard } from '@/modules/auth/auth.roles.guard'
import { RateLimit } from '@/modules/rate-limit/rate-limit.decorator'
import { SpotifyService } from '@/modules/spotify/spotify.service'
import { RATE_LIMITS } from '@/utils/rate-limits'

@Controller('/auth/spotify')
@UseGuards(AuthGuard, new RolesGuard([UserRole.ADMIN]))
@RateLimit(RATE_LIMITS.spotify)
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
