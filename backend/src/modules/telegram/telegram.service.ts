import { Buffer } from 'node:buffer'
import { randomBytes } from 'node:crypto'
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common'
import { createRemoteJWKSet, jwtVerify } from 'jose'
import { env } from '@/utils/enviroments'
import {
  TELEGRAM_OIDC_ISSUER,
  TELEGRAM_OIDC_JWKS_URL,
  TELEGRAM_OIDC_TOKEN_URL,
} from './telegram.constants'
import { buildTelegramAuthorizeUrl, createPkcePair, mapTelegramOidcClaims } from './telegram.utils'
import type { TelegramOidcClaims, TelegramProfile } from './telegram.types'

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name)
  private readonly jwks = createRemoteJWKSet(new URL(TELEGRAM_OIDC_JWKS_URL))

  get isConfigured(): boolean {
    return Boolean(env.TELEGRAM_CLIENT_ID && env.TELEGRAM_CLIENT_SECRET)
  }

  assertConfigured(): void {
    if (!this.isConfigured) {
      throw new HttpException('Telegram auth is not configured', HttpStatus.SERVICE_UNAVAILABLE)
    }
  }

  createAuthorizationRequest(): { url: string; state: string; codeVerifier: string } {
    const { clientId } = this.requireCredentials()

    const state = randomBytes(16).toString('hex')
    const { verifier, challenge } = createPkcePair()
    const url = buildTelegramAuthorizeUrl({
      clientId,
      redirectUri: env.TELEGRAM_OIDC_REDIRECT_URI,
      state,
      codeChallenge: challenge,
    })

    return { url, state, codeVerifier: verifier }
  }

  async exchangeCode(code: string, codeVerifier: string): Promise<TelegramProfile> {
    const { clientId, clientSecret } = this.requireCredentials()

    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

    const response = await fetch(TELEGRAM_OIDC_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${credentials}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: env.TELEGRAM_OIDC_REDIRECT_URI,
        client_id: clientId,
        code_verifier: codeVerifier,
      }).toString(),
      signal: AbortSignal.timeout(15_000),
    })

    if (!response.ok) {
      const body = await response.text()
      this.logger.warn(`Telegram token exchange failed (${response.status}): ${body.slice(0, 200)}`)
      throw new HttpException('Telegram token exchange failed', HttpStatus.BAD_GATEWAY)
    }

    const data = (await response.json()) as { id_token?: string }
    if (!data.id_token) {
      throw new HttpException('Telegram did not return an id_token', HttpStatus.BAD_GATEWAY)
    }

    return this.verifyIdToken(data.id_token)
  }

  async verifyIdToken(idToken: string): Promise<TelegramProfile> {
    try {
      const { payload } = await jwtVerify(idToken, this.jwks, {
        issuer: TELEGRAM_OIDC_ISSUER,
        audience: env.TELEGRAM_CLIENT_ID,
      })
      return mapTelegramOidcClaims(payload as TelegramOidcClaims)
    } catch (error) {
      this.logger.warn(`Telegram id_token verification failed: ${String(error)}`)
      throw new HttpException('Invalid Telegram id_token', HttpStatus.UNAUTHORIZED)
    }
  }

  private requireCredentials(): { clientId: string; clientSecret: string } {
    this.assertConfigured()

    const clientId = env.TELEGRAM_CLIENT_ID
    const clientSecret = env.TELEGRAM_CLIENT_SECRET
    if (!clientId || !clientSecret) {
      throw new HttpException('Telegram auth is not configured', HttpStatus.SERVICE_UNAVAILABLE)
    }
    return { clientId, clientSecret }
  }
}
