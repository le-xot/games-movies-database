import { authModels, type Authenticator, requireAuthenticated } from '@backend/gateway/auth'
import { standardErrors, apiErrorModels } from '@backend/gateway/errors'
import { rateLimitGuard, type RateLimiter } from '@backend/gateway/rate-limit'
import { RATE_LIMITS } from '@backend/utils/rate-limits'
import { Elysia } from 'elysia'

export interface MeRouteDeps {
  auth: Authenticator
  rateLimit: RateLimiter
}

/**
 * `GET /auth/me` — самый нагруженный эндпоинт: с него начинается загрузка
 * приложения. Здесь же обкатывается цепочка «лимит → auth».
 *
 * Порядок важен и повторяет Nest: глобальный RateLimitGuard срабатывает раньше,
 * чем AuthGuard на роуте.
 */
export function meRoutes({ auth, rateLimit }: MeRouteDeps) {
  const limit = rateLimitGuard(rateLimit)

  return new Elysia({ name: 'me' }).model({ ...apiErrorModels, ...authModels }).get(
    '/auth/me',
    async ({ request, server, route }) => {
      await limit({ request, server, route }, RATE_LIMITS.public)

      return await requireAuthenticated(auth, request)
    },
    {
      response: {
        200: 'UserEntity' as const,
        ...standardErrors(),
      },
    },
  )
}
