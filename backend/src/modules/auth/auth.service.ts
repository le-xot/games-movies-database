import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { TwitchService } from '../twitch/twitch.service'
import { UserService } from '../user/user.service'

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly twitch: TwitchService,
  ) {}

  private async signJwt(userId: string): Promise<string> {
    this.logger.log(`Signing JWT for userId=${userId}`)
    const foundedUser = await this.userService.getUserById(userId)
    if (!foundedUser) {
      throw new HttpException(
        'User does not exist',
        HttpStatus.UNAUTHORIZED,
      )
    }

    const payload = { id: foundedUser.id }

    return await this.jwtService.signAsync(payload)
  }

  async handleCallback(code: string) {
    this.logger.log('Handling auth callback')
    const autorizationCode = await this.twitch.getAuthorizationCode(code)
    const user = await this.twitch.getTwitchUser(autorizationCode)

    await this.userService.upsertUser(user.id, { login: user.login, profileImageUrl: user.profile_image_url })

    const token = await this.signJwt(user.id)
    this.logger.log(`Auth callback handled for userId=${user.id}`)
    return token
  }
}
