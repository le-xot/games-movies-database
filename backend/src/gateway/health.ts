import { apiErrorModels, publicErrors } from '@backend/gateway/errors'
import { rateLimitGuard, type RateLimiter } from '@backend/gateway/rate-limit'
import { RATE_LIMITS } from '@backend/utils/rate-limits'
import { Elysia, t } from 'elysia'

export const healthModels = {
  HealthResponseDTO: t.Object({
    status: t.String(),
  }),
}

export function healthRoutes({ rateLimit }: { rateLimit: RateLimiter }) {
  const limit = rateLimitGuard(rateLimit)

  return new Elysia({ name: 'health' }).model({ ...apiErrorModels, ...healthModels }).get(
    '/health',
    async ({ request, server, route }) => {
      await limit({ request, server, route }, RATE_LIMITS.public)

      return { status: 'ok' }
    },
    {
      response: {
        200: 'HealthResponseDTO' as const,
        ...publicErrors(),
      },
    },
  )
}
