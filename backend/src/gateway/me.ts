import { Elysia } from 'elysia'
import { authModels, requireUser, resolveUser, type Authenticator } from '@/gateway/auth'
import { apiErrorModels, standardErrors } from '@/gateway/errors'
import { enforceRateLimit, type RateLimiter } from '@/gateway/rate-limit'
import { RATE_LIMITS } from '@/utils/rate-limits'

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
  return new Elysia({ name: 'me' }).model({ ...apiErrorModels, ...authModels }).get(
    '/auth/me',
    async ({ request, server }) => {
      await enforceRateLimit(rateLimit, {
        request,
        route: 'AuthController.me',
        config: RATE_LIMITS.public,
        ip: server?.requestIP(request)?.address,
      })

      return requireUser(await resolveUser(auth, request))
    },
    {
      response: {
        200: 'UserEntity' as const,
        ...standardErrors(),
      },
    },
  )
}
