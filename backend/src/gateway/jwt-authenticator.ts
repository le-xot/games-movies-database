import { jwtVerify } from 'jose'
import type { Authenticator, GatewayUser } from '@backend/gateway/auth'

export interface JwtAuthenticatorOptions {
  secret: string
  users: { getById(id: string): Promise<GatewayUser | null> }
}

/**
 * Проверка сессионного JWT из cookie `token`.
 *
 * Токены подписаны `@nestjs/jwt` (jsonwebtoken) алгоритмом HS256 — проверяем
 * через `jose`, чтобы не тащить Nest в гейтвей. Алгоритм задан явно: иначе
 * токен с `alg: none` или подменённым алгоритмом теоретически может пройти.
 *
 * Любая проблема с токеном — это «гость», а не ошибка: решение, отдавать 401,
 * принимает роут (`requireUser`).
 */
export function createJwtAuthenticator({ secret, users }: JwtAuthenticatorOptions): Authenticator {
  const key = new TextEncoder().encode(secret)

  return {
    async resolve(token: string): Promise<GatewayUser | null> {
      try {
        const { payload } = await jwtVerify(token, key, { algorithms: ['HS256'] })
        if (typeof payload['id'] !== 'string') return null

        return await users.getById(payload['id'])
      } catch {
        return null
      }
    },
  }
}
