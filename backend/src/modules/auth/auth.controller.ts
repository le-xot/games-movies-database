import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common'
import { ApiResponse } from '@nestjs/swagger'
import { Throttle } from '@nestjs/throttler'
import crypto from 'node:crypto'
import { AuthGuard } from '@/modules/auth/auth.guard'
import { AuthService } from '@/modules/auth/auth.service'
import { User } from '@/modules/auth/auth.user.decorator'
import { CallbackDto } from '@/modules/auth/dto/callback.dto'
import { UpdateNicknameDTO } from '@/modules/auth/dto/update-nickname.dto'
import { TwitchService } from '@/modules/twitch/twitch.service'
import { UserEntity } from '@/modules/user/user.entity'
import { UserService } from '@/modules/user/user.service'
import { env } from '@/utils/enviroments'
import { THROTTLER_LIMITS } from '@/utils/throttler'
import type { Request, Response } from 'express'

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly twitch: TwitchService,
  ) {}

  @Get('/twitch')
  @Throttle({ default: THROTTLER_LIMITS.auth })
  twitchAuth(@Res() res: Response) {
    const redirectUri =
      'https://id.twitch.tv/oauth2/authorize?' +
      `client_id=${env.TWITCH_CLIENT_ID}&` +
      `redirect_uri=${env.TWITCH_CALLBACK_URL}&` +
      'response_type=code&' +
      'scope=user:read:email'
    res.redirect(redirectUri)
  }

  @Get('/twitch/link')
  @Throttle({ default: THROTTLER_LIMITS.auth })
  @UseGuards(AuthGuard)
  twitchLinkAuth(@Res() res: Response) {
    res.cookie('twitch_linking', '1', {
      httpOnly: false,
      maxAge: 10 * 60 * 1000,
    })

    const redirectUri =
      'https://id.twitch.tv/oauth2/authorize?' +
      `client_id=${env.TWITCH_CLIENT_ID}&` +
      `redirect_uri=${env.TWITCH_CALLBACK_URL}&` +
      'response_type=code&' +
      'scope=user:read:email'
    res.redirect(redirectUri)
  }

  @Post('/twitch/callback')
  @Throttle({ default: THROTTLER_LIMITS.auth })
  async twitchAuthCallback(@Body() data: CallbackDto, @Res() res: Response) {
    const token = await this.authService.handleTwitchCallback(data.code)
    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    })

    res.status(200).send('Authentication successful')
  }

  @Post('/twitch/link')
  @Throttle({ default: THROTTLER_LIMITS.auth })
  @UseGuards(AuthGuard)
  async linkTwitch(
    @Body() data: CallbackDto,
    @User() user: UserEntity,
    @Res() res: Response,
  ) {
    await this.authService.linkTwitchAccount(user.id, data.code)
    res.clearCookie('twitch_linking')
    res.status(200).send('Twitch account linked')
  }

  @Get('/kick')
  @Throttle({ default: THROTTLER_LIMITS.auth })
  kickAuth(@Res() res: Response) {
    const codeVerifier = crypto.randomBytes(32).toString('base64url')
    const codeChallenge = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64url')

    res.cookie('kick_code_verifier', codeVerifier, {
      httpOnly: true,
      maxAge: 10 * 60 * 1000,
    })

    const redirectUri =
      'https://id.kick.com/oauth/authorize?' +
      `client_id=${env.KICK_CLIENT_ID}&` +
      `redirect_uri=${env.KICK_CALLBACK_URL}&` +
      'response_type=code&' +
      'scope=user:read&' +
      `code_challenge=${codeChallenge}&` +
      'code_challenge_method=S256&' +
      `state=${crypto.randomBytes(16).toString('hex')}`

    res.redirect(redirectUri)
  }

  @Get('/kick/link')
  @Throttle({ default: THROTTLER_LIMITS.auth })
  @UseGuards(AuthGuard)
  kickLinkAuth(@Res() res: Response) {
    const codeVerifier = crypto.randomBytes(32).toString('base64url')
    const codeChallenge = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64url')

    res.cookie('kick_code_verifier', codeVerifier, {
      httpOnly: true,
      maxAge: 10 * 60 * 1000,
    })
    res.cookie('kick_linking', '1', {
      httpOnly: false,
      maxAge: 10 * 60 * 1000,
    })

    const redirectUri =
      'https://id.kick.com/oauth/authorize?' +
      `client_id=${env.KICK_CLIENT_ID}&` +
      `redirect_uri=${env.KICK_CALLBACK_URL}&` +
      'response_type=code&' +
      'scope=user:read&' +
      `code_challenge=${codeChallenge}&` +
      'code_challenge_method=S256&' +
      `state=${crypto.randomBytes(16).toString('hex')}`

    res.redirect(redirectUri)
  }

  @Post('/kick/callback')
  @Throttle({ default: THROTTLER_LIMITS.auth })
  async kickAuthCallback(
    @Body() data: CallbackDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const codeVerifier = (req as any).cookies?.kick_code_verifier
    if (!codeVerifier) {
      throw new HttpException('Missing code verifier', HttpStatus.BAD_REQUEST)
    }

    const token = await this.authService.handleKickCallback(data.code, codeVerifier)
    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    })
    res.clearCookie('kick_code_verifier')
    res.status(200).send('Authentication successful')
  }

  @Post('/kick/link')
  @Throttle({ default: THROTTLER_LIMITS.auth })
  @UseGuards(AuthGuard)
  async linkKick(
    @Body() data: CallbackDto,
    @Req() req: Request,
    @User() user: UserEntity,
    @Res() res: Response,
  ) {
    const codeVerifier = (req as any).cookies?.kick_code_verifier
    if (!codeVerifier) {
      throw new HttpException('Missing code verifier', HttpStatus.BAD_REQUEST)
    }

    await this.authService.linkKickAccount(user.id, data.code, codeVerifier)
    res.clearCookie('kick_code_verifier')
    res.status(200).send('Kick account linked')
  }

  @Get('/accounts')
  @UseGuards(AuthGuard)
  getLinkedAccounts(@User() user: UserEntity) {
    return this.userService.getLinkedAccounts(user.id)
  }

  @Get('/me')
  @UseGuards(AuthGuard)
  @ApiResponse({ type: UserEntity, status: 200 })
  me(@User() user: UserEntity) {
    return user
  }

  @Patch('/me')
  @Throttle({ default: THROTTLER_LIMITS.write })
  @UseGuards(AuthGuard)
  updateNickname(@Body() data: UpdateNicknameDTO, @User() user: UserEntity) {
    return this.userService.updateLogin(user.id, data.login)
  }

  @Post('/logout')
  @Throttle({ default: THROTTLER_LIMITS.auth })
  logout(@Res() res: Response) {
    res.clearCookie('token')
    res.end()
  }
}
