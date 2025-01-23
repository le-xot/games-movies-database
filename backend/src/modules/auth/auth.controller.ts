import { Controller, Get, Query, Res } from '@nestjs/common'
import { PrismaRoles } from '@prisma/client'
import { env } from '../../utils/enviroments'
import { UserServices } from '../user/user.service'
import { AuthService } from './auth.service'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService, private readonly userService: UserServices) {}

  @Get('twitch')
  async twitchAuth(@Res() res) {
    const redirectUri = `https://id.twitch.tv/oauth2/authorize?`
      + `client_id=${env.TWITCH_CLIENT_ID}&`
      + `redirect_uri=${env.TWITCH_CALLBACK_URL}&`
      + `response_type=code&`
      + `scope=user:read:email`
    res.redirect(redirectUri)
  }

  @Get('twitch/callback')
  async twitchAuthCallback(@Query('code') code: string, @Res() res) {
    try {
      const accessToken = await this.authService.getAccessToken(code)
      const user = await this.authService.getTwitchUser(accessToken)

      await this.userService.upsertUser(user.login, user.id, PrismaRoles.USER)

      res.redirect('http://localhost:5173/db/queue')
    } catch (error) {
      console.error(error)
      res.status(500).send('Authentication failed')
    }
  }
}
