import { Body, Controller, Get, Post, Res, UseGuards } from '@nestjs/common'
import { ApiResponse } from '@nestjs/swagger'
import { env } from '../../utils/enviroments'
import { UserEntity } from '../user/user.entity'
import { UserService } from '../user/user.service'
import { AuthGuard } from './auth.guard'
import { AuthService } from './auth.service'
import { User } from './auth.user.decorator'
import { CallbackDto } from './dto/callback.dto'
import type { Response } from 'express'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService, private readonly userService: UserService) {}

  @Get('/twitch')
  twitchAuth(@Res() res: Response) {
    const redirectUri = `https://id.twitch.tv/oauth2/authorize?`
      + `client_id=${env.TWITCH_CLIENT_ID}&`
      + `redirect_uri=${env.TWITCH_CALLBACK_URL}&`
      + `response_type=code&`
      + `scope=user:read:email`
    res.redirect(redirectUri)
  }

  @Post('/twitch/callback')
  async twitchAuthCallback(@Body() data: CallbackDto, @Res() res: Response) {
    try {
      const accessToken = await this.authService.getAccessToken(data.code)
      const user = await this.authService.getTwitchUser(accessToken)

      await this.userService.upsertUser({ id: user.id, login: user.login, profileImageUrl: user.profile_image_url })

      const token = await this.authService.signJwt(user.id)

      res.cookie('token', token, {
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000,
      })

      res.status(200).send('Authentication successful')
    } catch (error) {
      console.error(error)
      res.status(500).send('Authentication failed')
    }
  }

  @Get('/me')
  @UseGuards(AuthGuard)
  @ApiResponse({ type: UserEntity, status: 200 })
  me(@User() user: UserEntity) {
    return user
  }

  @Post('/logout')
  logout(@Res() res: Response) {
    res.clearCookie('token')
    res.end()
  }
}
