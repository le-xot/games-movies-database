import { ForbiddenException, HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { KickService } from '@/modules/kick/kick.service'
import { TelegramService } from '@/modules/telegram/telegram.service'
import { formatTelegramLogin } from '@/modules/telegram/telegram.utils'
import { TwitchService } from '@/modules/twitch/twitch.service'
import { UserService } from '@/modules/user/user.service'
import type { TelegramAuthMode, TelegramAuthRecord } from '@/modules/telegram/telegram.types'
import type { UserDomain } from '@/modules/user/entities/user-domain.entity'

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly twitch: TwitchService,
    private readonly kick: KickService,
    private readonly telegram: TelegramService,
  ) {}

  private signJwt(userId: string): Promise<string> {
    this.logger.log(`Signing JWT for userId=${userId}`)
    return this.jwtService.signAsync({ id: userId })
  }

  private async completeLogin(provider: string, user: UserDomain): Promise<string> {
    const token = await this.signJwt(user.id)
    this.logger.log(`${provider} auth completed for userId=${user.id}`)
    return token
  }

  async handleTwitchCallback(code: string) {
    this.logger.log('Handling Twitch auth callback')
    const authorizationCode = await this.twitch.getAuthorizationCode(code)
    const twitchUser = await this.twitch.getTwitchUser(authorizationCode)

    const user = await this.userService.upsertUser(
      twitchUser.id,
      {
        login: twitchUser.login,
        profileImageUrl: twitchUser.profile_image_url,
      },
      'TWITCH',
    )

    return this.completeLogin('Twitch', user)
  }

  async handleKickCallback(code: string, codeVerifier: string) {
    this.logger.log('Handling Kick auth callback')
    const accessToken = await this.kick.getAuthorizationCode(code, codeVerifier)
    const kickUser = await this.kick.getKickUser(accessToken)

    const user = await this.userService.upsertUser(
      kickUser.user_id.toString(),
      {
        login: kickUser.name,
        profileImageUrl: kickUser.profile_picture,
      },
      'KICK',
    )

    return this.completeLogin('Kick', user)
  }

  async linkKickAccount(userId: string, code: string, codeVerifier: string) {
    this.logger.log(`linkKickAccount: userId=${userId}`)
    const accessToken = await this.kick.getAuthorizationCode(code, codeVerifier)
    const kickUser = await this.kick.getKickUser(accessToken)
    this.logger.log(`linkKickAccount: fetched Kick user=${kickUser.name} (id=${kickUser.user_id})`)

    await this.userService.linkPlatformAccount(userId, {
      platform: 'KICK',
      platformUserId: kickUser.user_id.toString(),
      platformLogin: kickUser.name,
      platformAvatar: kickUser.profile_picture,
    })

    this.logger.log(`linkKickAccount: linked Kick/${kickUser.name} to userId=${userId}`)
    return kickUser
  }

  async linkTwitchAccount(userId: string, code: string) {
    this.logger.log(`linkTwitchAccount: userId=${userId}`)
    const accessToken = await this.twitch.getAuthorizationCode(code)
    const twitchUser = await this.twitch.getTwitchUser(accessToken)
    this.logger.log(
      `linkTwitchAccount: fetched Twitch user=${twitchUser.login} (id=${twitchUser.id})`,
    )

    await this.userService.linkPlatformAccount(userId, {
      platform: 'TWITCH',
      platformUserId: twitchUser.id,
      platformLogin: twitchUser.login,
      platformAvatar: twitchUser.profile_image_url,
    })

    this.logger.log(`linkTwitchAccount: linked Twitch/${twitchUser.login} to userId=${userId}`)
    return twitchUser
  }

  async startTelegramAuth(
    mode: TelegramAuthMode,
    userId?: string,
    origin?: string,
  ): Promise<{ token: string; url: string }> {
    this.telegram.assertConfigured()
    const token = await this.telegram.createAuthToken(mode, userId, origin)
    return { token, url: this.telegram.buildStartLink(token) }
  }

  private async resolveTelegramToken(
    token: string | undefined,
    mode: TelegramAuthMode,
  ): Promise<{ status: 'pending' } | { status: 'ready'; record: TelegramAuthRecord }> {
    if (!token) {
      throw new HttpException('Missing telegram auth token', HttpStatus.BAD_REQUEST)
    }

    const pending = await this.telegram.getAuthToken(token)
    if (!pending || pending.mode !== mode) {
      throw new HttpException('Telegram auth link expired', HttpStatus.GONE)
    }
    if (pending.status === 'pending') {
      return { status: 'pending' }
    }

    const record = await this.telegram.consumeAuthToken(token)
    if (!record?.profile) {
      throw new HttpException('Telegram auth link expired', HttpStatus.GONE)
    }
    return { status: 'ready', record }
  }

  async pollTelegramLogin(
    token: string | undefined,
  ): Promise<{ status: 'pending' } | { status: 'ok'; jwt: string }> {
    const result = await this.resolveTelegramToken(token, 'login')
    if (result.status === 'pending') return result

    const { profile } = result.record
    const user = await this.userService.upsertUser(
      profile.id,
      { login: formatTelegramLogin(profile), profileImageUrl: profile.photoUrl ?? '' },
      'TELEGRAM',
    )

    const jwt = await this.completeLogin('Telegram', user)
    return { status: 'ok', jwt }
  }

  async pollTelegramLink(
    token: string | undefined,
    userId: string,
  ): Promise<{ status: 'pending' } | { status: 'ok' }> {
    const result = await this.resolveTelegramToken(token, 'link')
    if (result.status === 'pending') return result

    const { record } = result
    if (record.userId !== userId) {
      throw new ForbiddenException('Telegram link belongs to another session')
    }

    const { profile } = record
    const accounts = await this.userService.getLinkedAccounts(userId)
    if (accounts.some((account) => account.platform === 'TELEGRAM')) {
      throw new HttpException('Telegram account is already linked', HttpStatus.CONFLICT)
    }

    await this.userService.linkPlatformAccount(userId, {
      platform: 'TELEGRAM',
      platformUserId: profile.id,
      platformLogin: formatTelegramLogin(profile),
      platformAvatar: profile.photoUrl,
    })

    this.logger.log(`Telegram account ${profile.id} linked to userId=${userId}`)
    return { status: 'ok' }
  }
}
