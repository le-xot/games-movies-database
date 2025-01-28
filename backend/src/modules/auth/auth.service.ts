import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { env } from '../../utils/enviroments'
import { UserService } from '../user/user.service'

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userServices: UserService,
  ) {}

  async getTwitchUser(accessToken: string) {
    const response = await fetch('https://api.twitch.tv/helix/users', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Client-ID': env.TWITCH_CLIENT_ID,
      },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch user data from Twitch')
    }

    const data = await response.json()
    return data.data[0]
  }

  async getAccessToken(code: string) {
    const response = await fetch('https://id.twitch.tv/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: env.TWITCH_CLIENT_ID,
        client_secret: env.TWITCH_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: env.TWITCH_CALLBACK_URL,
      }).toString(),
    })

    if (!response.ok) {
      throw new Error('Failed to fetch access token from Twitch')
    }

    const data = await response.json()
    return data.access_token
  }

  async signJwt(userId: string): Promise<string> {
    const foundedUser = await this.userServices.getUserById(userId)
    if (!foundedUser) {
      throw new HttpException(
        'User does not exist',
        HttpStatus.UNAUTHORIZED,
      )
    }

    const payload = { id: foundedUser.id }

    return await this.jwtService.signAsync(payload)
  }
}
