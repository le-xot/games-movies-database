import crypto from 'node:crypto'
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Logger,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { FileInterceptor } from '@nestjs/platform-express'
import { ApiResponse } from '@nestjs/swagger'
import { AuthGuard } from '@/modules/auth/auth.guard'
import { AuthService } from '@/modules/auth/auth.service'
import { User } from '@/modules/auth/auth.user.decorator'
import { CallbackDto } from '@/modules/auth/dto/callback.dto'
import { UpdateNicknameDTO } from '@/modules/auth/dto/update-nickname.dto'
import { RateLimit } from '@/modules/rate-limit/rate-limit.decorator'
import {
  TELEGRAM_OIDC_LINKING_COOKIE,
  TELEGRAM_OIDC_STATE_COOKIE,
  TELEGRAM_OIDC_TTL_SECONDS,
  TELEGRAM_OIDC_VERIFIER_COOKIE,
} from '@/modules/telegram/telegram.constants'
import { TelegramService } from '@/modules/telegram/telegram.service'
import { TwitchService } from '@/modules/twitch/twitch.service'
import { UserEntity } from '@/modules/user/user.entity'
import { UserService } from '@/modules/user/user.service'
import { env } from '@/utils/enviroments'
import { RATE_LIMITS } from '@/utils/rate-limits'
import type { Request, Response } from 'express'

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name)

  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly twitch: TwitchService,
    private readonly telegram: TelegramService,
    private readonly jwtService: JwtService,
  ) {}

  private buildTwitchAuthUrl(): string {
    return (
      'https://id.twitch.tv/oauth2/authorize?' +
      `client_id=${env.TWITCH_CLIENT_ID}&` +
      `redirect_uri=${env.TWITCH_CALLBACK_URL}&` +
      'response_type=code&' +
      'scope=user:read:email'
    )
  }

  private beginKickAuth(res: Response, linking = false) {
    const codeVerifier = crypto.randomBytes(32).toString('base64url')
    const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url')

    res.cookie('kick_code_verifier', codeVerifier, {
      httpOnly: true,
      maxAge: 10 * 60 * 1000,
    })
    if (linking) {
      res.cookie('kick_linking', '1', {
        httpOnly: false,
        maxAge: 10 * 60 * 1000,
      })
    }

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

  private setAuthCookie(res: Response, token: string) {
    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    })
  }

  @Get('/twitch')
  @RateLimit(RATE_LIMITS.auth)
  twitchAuth(@Res() res: Response) {
    res.redirect(this.buildTwitchAuthUrl())
  }

  @Get('/twitch/link')
  @RateLimit(RATE_LIMITS.auth)
  @UseGuards(AuthGuard)
  twitchLinkAuth(@Res() res: Response) {
    res.cookie('twitch_linking', '1', {
      httpOnly: false,
      maxAge: 10 * 60 * 1000,
    })

    res.redirect(this.buildTwitchAuthUrl())
  }

  @Post('/twitch/callback')
  @RateLimit(RATE_LIMITS.auth)
  async twitchAuthCallback(@Body() data: CallbackDto, @Res() res: Response) {
    const token = await this.authService.handleTwitchCallback(data.code)
    this.setAuthCookie(res, token)

    res.status(200).send('Authentication successful')
  }

  @Post('/twitch/link')
  @RateLimit(RATE_LIMITS.auth)
  @UseGuards(AuthGuard)
  async linkTwitch(@Body() data: CallbackDto, @User() user: UserEntity, @Res() res: Response) {
    this.logger.log(`POST /twitch/link: userId=${user.id}`)
    try {
      await this.authService.linkTwitchAccount(user.id, data.code)
      res.clearCookie('twitch_linking')
      res.status(200).send('Twitch account linked')
    } catch (error) {
      this.logger.error(`POST /twitch/link failed for userId=${user.id}: ${error}`)
      throw error
    }
  }

  @Get('/kick')
  @RateLimit(RATE_LIMITS.auth)
  kickAuth(@Res() res: Response) {
    this.beginKickAuth(res)
  }

  @Get('/kick/link')
  @RateLimit(RATE_LIMITS.auth)
  @UseGuards(AuthGuard)
  kickLinkAuth(@Res() res: Response) {
    this.beginKickAuth(res, true)
  }

  @Post('/kick/callback')
  @RateLimit(RATE_LIMITS.auth)
  async kickAuthCallback(@Body() data: CallbackDto, @Req() req: Request, @Res() res: Response) {
    const codeVerifier = (req as any).cookies?.kick_code_verifier
    if (!codeVerifier) {
      throw new HttpException('Missing code verifier', HttpStatus.BAD_REQUEST)
    }

    const token = await this.authService.handleKickCallback(data.code, codeVerifier)
    this.setAuthCookie(res, token)
    res.clearCookie('kick_code_verifier')
    res.status(200).send('Authentication successful')
  }

  @Post('/kick/link')
  @RateLimit(RATE_LIMITS.auth)
  @UseGuards(AuthGuard)
  async linkKick(
    @Body() data: CallbackDto,
    @Req() req: Request,
    @User() user: UserEntity,
    @Res() res: Response,
  ) {
    this.logger.log(`POST /kick/link: userId=${user.id}`)
    const codeVerifier = (req as any).cookies?.kick_code_verifier
    if (!codeVerifier) {
      this.logger.warn(`POST /kick/link: missing code_verifier cookie for userId=${user.id}`)
      throw new HttpException('Missing code verifier', HttpStatus.BAD_REQUEST)
    }

    try {
      await this.authService.linkKickAccount(user.id, data.code, codeVerifier)
      res.clearCookie('kick_code_verifier')
      res.status(200).send('Kick account linked')
    } catch (error) {
      this.logger.error(`POST /kick/link failed for userId=${user.id}: ${error}`)
      throw error
    }
  }

  @Get('/telegram')
  @RateLimit(RATE_LIMITS.auth)
  telegramAuth(@Res() res: Response) {
    const { url, state, codeVerifier } = this.telegram.createAuthorizationRequest()
    this.setTelegramOidcCookies(res, state, codeVerifier)
    res.redirect(url)
  }

  @Get('/telegram/link')
  @RateLimit(RATE_LIMITS.auth)
  @UseGuards(AuthGuard)
  telegramLinkAuth(@Res() res: Response) {
    const { url, state, codeVerifier } = this.telegram.createAuthorizationRequest()
    this.setTelegramOidcCookies(res, state, codeVerifier, true)
    res.redirect(url)
  }

  @Get('/telegram/oidc/callback')
  @RateLimit(RATE_LIMITS.auth)
  async telegramOidcCallback(
    @Req() req: Request,
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('error') oidcError: string | undefined,
    @Res() res: Response,
  ) {
    const cookies = (req as any).cookies ?? {}
    const storedState = cookies[TELEGRAM_OIDC_STATE_COOKIE]
    const codeVerifier = cookies[TELEGRAM_OIDC_VERIFIER_COOKIE]
    const isLinking = cookies[TELEGRAM_OIDC_LINKING_COOKIE] === '1'
    const mode = isLinking ? 'link' : 'login'
    this.clearTelegramOidcCookies(res)

    try {
      if (oidcError) {
        throw new HttpException(`Telegram: ${oidcError}`, HttpStatus.BAD_REQUEST)
      }
      if (!storedState || !state || state !== storedState) {
        throw new HttpException('Invalid state', HttpStatus.BAD_REQUEST)
      }
      if (!code || !codeVerifier) {
        throw new HttpException('Missing code or verifier', HttpStatus.BAD_REQUEST)
      }

      const profile = await this.telegram.exchangeCode(code, codeVerifier)

      if (isLinking) {
        const userId = await this.getUserIdFromToken(req)
        if (!userId) {
          throw new HttpException('Not authenticated', HttpStatus.UNAUTHORIZED)
        }
        await this.authService.linkTelegramOidc(userId, profile)
        res.redirect(`${env.TELEGRAM_CALLBACK_URL}?mode=link`)
        return
      }

      const token = await this.authService.handleTelegramOidcLogin(profile)
      this.setAuthCookie(res, token)
      res.redirect(`${env.TELEGRAM_CALLBACK_URL}?mode=login`)
    } catch (error) {
      const message =
        error instanceof HttpException ? error.message : 'Telegram authorization failed'
      this.logger.warn(`Telegram OIDC callback failed: ${message}`)
      const params = new URLSearchParams({ mode, error: message })
      res.redirect(`${env.TELEGRAM_CALLBACK_URL}?${params.toString()}`)
    }
  }

  @Get('/accounts')
  @UseGuards(AuthGuard)
  getLinkedAccounts(@User() user: UserEntity) {
    return this.userService.getLinkedAccounts(user.id)
  }

  @Delete('/accounts/:platform')
  @RateLimit(RATE_LIMITS.write)
  @UseGuards(AuthGuard)
  async unlinkAccount(@Param('platform') platform: string, @User() user: UserEntity) {
    await this.userService.unlinkPlatformAccount(user.id, platform)
    return { success: true }
  }

  @Delete('/me')
  @RateLimit(RATE_LIMITS.write)
  @UseGuards(AuthGuard)
  async deleteMe(@User() user: UserEntity, @Res() res: Response) {
    await this.userService.deleteUserById(user.id)
    res.clearCookie('token')
    res.status(200).json({ success: true })
  }

  @Get('/me')
  @UseGuards(AuthGuard)
  @ApiResponse({ type: UserEntity, status: 200 })
  me(@User() user: UserEntity) {
    return user
  }

  @Patch('/me')
  @RateLimit(RATE_LIMITS.write)
  @UseGuards(AuthGuard)
  updateNickname(@Body() data: UpdateNicknameDTO, @User() user: UserEntity) {
    return this.userService.updateLogin(user.id, data.login)
  }

  @Post('/me/avatar')
  @RateLimit(RATE_LIMITS.write)
  @UseGuards(AuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
          cb(null, true)
        } else {
          cb(new HttpException('Only image files are allowed', HttpStatus.BAD_REQUEST), false)
        }
      },
    }),
  )
  uploadAvatar(
    @UploadedFile() file: { buffer: Buffer; mimetype: string; size: number },
    @User() user: UserEntity,
  ) {
    if (!file) {
      throw new HttpException('No file provided', HttpStatus.BAD_REQUEST)
    }
    return this.userService.uploadAvatar(user.id, file.buffer)
  }

  @Delete('/me/avatar')
  @RateLimit(RATE_LIMITS.write)
  @UseGuards(AuthGuard)
  deleteAvatar(@User() user: UserEntity) {
    return this.userService.deleteAvatar(user.id)
  }

  @Post('/logout')
  @RateLimit(RATE_LIMITS.auth)
  logout(@Res() res: Response) {
    res.clearCookie('token')
    res.end()
  }

  private setTelegramOidcCookies(
    res: Response,
    state: string,
    codeVerifier: string,
    linking = false,
  ) {
    const options = {
      httpOnly: true,
      sameSite: 'lax' as const,
      secure: env.NODE_ENV === 'production',
      maxAge: TELEGRAM_OIDC_TTL_SECONDS * 1000,
    }
    res.cookie(TELEGRAM_OIDC_STATE_COOKIE, state, options)
    res.cookie(TELEGRAM_OIDC_VERIFIER_COOKIE, codeVerifier, options)
    if (linking) {
      res.cookie(TELEGRAM_OIDC_LINKING_COOKIE, '1', { ...options, httpOnly: false })
    }
  }

  private clearTelegramOidcCookies(res: Response) {
    res.clearCookie(TELEGRAM_OIDC_STATE_COOKIE)
    res.clearCookie(TELEGRAM_OIDC_VERIFIER_COOKIE)
    res.clearCookie(TELEGRAM_OIDC_LINKING_COOKIE)
  }

  private async getUserIdFromToken(req: Request): Promise<string | null> {
    const token = (req as any).cookies?.token
    if (!token) return null

    try {
      const payload = await this.jwtService.verifyAsync(token, { secret: env.JWT_SECRET })
      return typeof payload?.id === 'string' ? payload.id : null
    } catch {
      return null
    }
  }
}
