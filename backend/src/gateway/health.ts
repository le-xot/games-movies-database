import { apiErrorModels, publicErrors } from '@backend/gateway/errors'
import { enforceRateLimit, type RateLimiter } from '@backend/gateway/rate-limit'
import { RATE_LIMITS } from '@backend/utils/rate-limits'
import { Elysia, t } from 'elysia'

export const healthModels = {
  HealthResponseDTO: t.Object({
    status: t.String(),
  }),
}

export function healthRoutes({ rateLimit }: { rateLimit: RateLimiter }) {
  return new Elysia({ name: 'health' }).model({ ...apiErrorModels, ...healthModels }).get(
    '/health',
    async ({ request, server }) => {
      await enforceRateLimit(rateLimit, {
        request,
        route: 'AppController.health',
        config: RATE_LIMITS.public,
        ip: server?.requestIP(request)?.address,
      })

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
