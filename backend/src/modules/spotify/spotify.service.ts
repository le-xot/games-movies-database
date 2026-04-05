import { Buffer } from 'node:buffer'
import {
  Injectable,
  InternalServerErrorException,
  Logger,
  OnApplicationBootstrap,
} from '@nestjs/common'
import { ThirdPartService } from '@/enums'
import { SpotifyClient } from '@soundify/web-api'
import { env } from '@/utils/enviroments'
import { SpotifyTokenRepository } from './repositories/spotify-token.repository'

@Injectable()
export class SpotifyService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SpotifyService.name)
  client: SpotifyClient | null = null

  constructor(private readonly tokenRepository: SpotifyTokenRepository) {}

  private createClient(accessToken: string | null): SpotifyClient {
    return new SpotifyClient(accessToken, {
      waitForRateLimit: true,
      refresher: async () => {
        this.logger.log('Performing refreshing of spotify tokens')
        const newToken = await this.refreshTokens()
        return newToken.accessToken
      },
    })
  }

  async onApplicationBootstrap() {
    const token = await this.tokenRepository.findByService(ThirdPartService.SPOTIFY)

    if (!token) {
      this.logger.warn('Spotify not authorized yet, skip creating client.')
      return
    }

    this.client = this.createClient(token.accessToken)
  }

  private async refreshTokens(): Promise<{ accessToken: string; refreshToken: string }> {
    const dbTokens = await this.tokenRepository.findByService(ThirdPartService.SPOTIFY)

    if (!dbTokens) {
      throw new Error('Spotify tokens not created')
    }

    const authorization = Buffer.from(
      `${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`,
    ).toString('base64')
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${authorization}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: dbTokens.refreshToken,
        client_id: env.SPOTIFY_CLIENT_ID,
      }),
    })
    if (!response.ok) {
      throw new Error(`Cannot refresh tokens: ${await response.text()}`)
    }

    const data: TokensResponse = await response.json()

    await this.tokenRepository.update(ThirdPartService.SPOTIFY, {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      obtainedAt: new Date(),
      expiresAt: new Date(Date.now() + Number(data.expires_in) * 1000),
    })

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
    }
  }

  createAuthorizationUrl(): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: env.SPOTIFY_CLIENT_ID,
      scope: 'user-modify-playback-state user-read-currently-playing user-read-playback-state',
      redirect_uri: env.SPOTIFY_CALLBACK_URL,
    })

    const url = new URL(`https://accounts.spotify.com/authorize?${params}`)

    return url.toString()
  }

  async authorize(code: string) {
    const authorization = Buffer.from(
      `${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`,
    ).toString('base64')
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${authorization}`,
      },
      body: new URLSearchParams({
        redirect_uri: env.SPOTIFY_CALLBACK_URL,
        grant_type: 'authorization_code',
        code,
      }),
    })
    if (!response.ok) {
      throw new InternalServerErrorException(await response.text())
    }

    const data: TokensResponse = await response.json()

    await this.tokenRepository.upsert(ThirdPartService.SPOTIFY, {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      obtainedAt: new Date(),
      expiresAt: new Date(Date.now() + Number(data.expires_in) * 1000),
    })

    this.client = this.createClient(data.access_token)
  }
}

interface TokensResponse {
  access_token: string
  token_type: string
  scope: string
  expires_in: number
  refresh_token: string
}
