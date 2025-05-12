import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { TwitchService } from '../twitch/twitch.service'
import { UserService } from '../user/user.service'

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly twitch: TwitchService,
  ) {}

  private async signJwt(userId: string): Promise<string> {
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
    const autorizationCode = await this.twitch.getAuthorizationCode(code)
    const user = await this.twitch.getTwitchUser(autorizationCode)

    await this.userService.upsertUser(user.id, { login: user.login, profileImageUrl: user.profile_image_url })

    const token = await this.signJwt(user.id)
    return token
  }
}
