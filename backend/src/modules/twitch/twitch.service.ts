import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { env } from '@/utils/enviroments'

interface TwitchToken {
  access_token: string
  expires_in: number
  expiresAt: number
}

@Injectable()
export class TwitchService implements OnModuleInit {
  private token: TwitchToken | null = null
  private readonly logger = new Logger(TwitchService.name)

  async onModuleInit() {
    this.logger.log('Initializing TwitchService and fetching app access token')
    await this.getAppAccessToken()
  }

  async getTwitchUser(accessToken: string) {
    const clientId = this.requireClientId()
    const response = await fetch('https://api.twitch.tv/helix/users', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Client-ID': clientId,
      },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch user data from Twitch')
    }

    const data = await response.json()
    return data.data[0]
  }

  async getAuthorizationCode(code: string) {
    const { clientId, clientSecret } = this.requireCredentials()
    const response = await fetch('https://id.twitch.tv/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
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

  async getAppAccessToken(): Promise<string> {
    if (this.token && Date.now() < this.token.expiresAt) {
      return this.token.access_token
    }

    try {
      const { clientId, clientSecret } = this.requireCredentials()
      const response = await fetch(
        `https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`,
        { method: 'POST' },
      )

      if (!response.ok) {
        throw new Error('Failed to fetch Twitch app access token')
      }

      const data = await response.json()

      this.token = {
        access_token: data.access_token,
        expires_in: data.expires_in,
        expiresAt: Date.now() + (data.expires_in - 60) * 1000,
      }

      return this.token.access_token
    } catch (error) {
      this.logger.error('Error fetching Twitch app access token:', error)
      throw error
    }
  }

  private requireClientId(): string {
    const clientId = env.TWITCH_CLIENT_ID
    if (!clientId) throw new Error('TWITCH_CLIENT_ID is not configured')
    return clientId
  }

  private requireCredentials(): { clientId: string; clientSecret: string } {
    const clientId = env.TWITCH_CLIENT_ID
    const clientSecret = env.TWITCH_CLIENT_SECRET
    if (!clientId || !clientSecret) throw new Error('Twitch credentials are not configured')
    return { clientId, clientSecret }
  }
}
