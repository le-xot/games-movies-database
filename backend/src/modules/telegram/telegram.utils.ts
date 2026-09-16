import { createHash, randomBytes } from 'node:crypto'
import { TELEGRAM_OIDC_AUTHORIZE_URL, TELEGRAM_OIDC_SCOPE } from './telegram.constants'
import type { TelegramOidcClaims, TelegramProfile } from './telegram.types'

export function createPkcePair(): { verifier: string; challenge: string } {
  const verifier = randomBytes(32).toString('base64url')
  const challenge = createHash('sha256').update(verifier).digest('base64url')
  return { verifier, challenge }
}

export function buildTelegramAuthorizeUrl(params: {
  clientId: string
  redirectUri: string
  state: string
  codeChallenge: string
}): string {
  const query = [
    ['client_id', params.clientId],
    ['redirect_uri', params.redirectUri],
    ['response_type', 'code'],
    ['scope', TELEGRAM_OIDC_SCOPE],
    ['state', params.state],
    ['code_challenge', params.codeChallenge],
    ['code_challenge_method', 'S256'],
  ]
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&')

  return `${TELEGRAM_OIDC_AUTHORIZE_URL}?${query}`
}

export function formatTelegramLogin(profile: TelegramProfile): string {
  if (profile.username) return profile.username
  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(' ')
  return fullName || `tg_${profile.id}`
}

export function mapTelegramOidcClaims(claims: TelegramOidcClaims): TelegramProfile {
  const id = claims.id !== undefined ? String(claims.id) : claims.sub
  if (!id) {
    throw new Error('Telegram id_token has no user id')
  }

  return {
    id,
    username: claims.preferred_username,
    firstName: claims.given_name ?? claims.name ?? '',
    lastName: claims.family_name,
    photoUrl: claims.picture,
  }
}
