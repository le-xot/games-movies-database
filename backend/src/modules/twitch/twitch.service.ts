import { Injectable, OnModuleInit } from '@nestjs/common'
import { env } from '../../utils/enviroments'

interface TwitchToken {
  access_token: string
  expires_in: number
  expiresAt: number
}

@Injectable()
export class TwitchService implements OnModuleInit {
  private token: TwitchToken | null = null

  async onModuleInit() {
    await this.getAppAccessToken()
  }

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

  async getAuthorizationCode(code: string) {
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

  async getAppAccessToken(): Promise<string> {
    if (this.token && Date.now() < this.token.expiresAt) {
      return this.token.access_token
    }

    try {
      const response = await fetch(
        `https://id.twitch.tv/oauth2/token?client_id=${env.TWITCH_CLIENT_ID}&client_secret=${env.TWITCH_CLIENT_SECRET}&grant_type=client_credentials`,
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
      console.error('Error fetching Twitch app access token:', error)
      throw error
    }
  }

  async searchTwitchUsers(login: string, accessToken: string) {
    const response = await fetch(`https://api.twitch.tv/helix/users?login=${login}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Client-ID': env.TWITCH_CLIENT_ID,
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to search Twitch users: ${response.status}`)
    }

    const data = await response.json()
    return data.data
  }
}
