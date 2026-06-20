import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { env } from '@/utils/enviroments'

interface KickToken {
  access_token: string
  expires_in: number
  expiresAt: number
}

interface KickUser {
  user_id: number
  name: string
  email: string
  profile_picture: string
}

@Injectable()
export class KickService implements OnModuleInit {
  private token: KickToken | null = null
  private readonly logger = new Logger(KickService.name)

  async onModuleInit() {
    if (env.KICK_CLIENT_ID && env.KICK_CLIENT_SECRET) {
      this.logger.log('Initializing KickService and fetching app access token')
      await this.getAppAccessToken()
    } else {
      this.logger.warn('Kick credentials not configured, skipping KickService init')
    }
  }

  async getKickUser(accessToken: string): Promise<KickUser> {
    const response = await fetch('https://api.kick.com/public/v1/users', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch user data from Kick')
    }

    const data = await response.json()
    return data.data[0]
  }

  async getAuthorizationCode(code: string, codeVerifier: string): Promise<string> {
    const response = await fetch('https://id.kick.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: env.KICK_CLIENT_ID,
        client_secret: env.KICK_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: env.KICK_CALLBACK_URL,
        code_verifier: codeVerifier,
      }).toString(),
    })

    if (!response.ok) {
      throw new Error('Failed to fetch access token from Kick')
    }

    const data = await response.json()
    return data.access_token
  }

  async getAppAccessToken(): Promise<string> {
    if (this.token && Date.now() < this.token.expiresAt) {
      return this.token.access_token
    }

    try {
      const response = await fetch('https://id.kick.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: env.KICK_CLIENT_ID,
          client_secret: env.KICK_CLIENT_SECRET,
          grant_type: 'client_credentials',
        }).toString(),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch Kick app access token')
      }

      const data = await response.json()

      this.token = {
        access_token: data.access_token,
        expires_in: data.expires_in,
        expiresAt: Date.now() + (data.expires_in - 60) * 1000,
      }

      return this.token.access_token
    } catch (error) {
      this.logger.error('Error fetching Kick app access token:', error as any)
      throw error
    }
  }
}
