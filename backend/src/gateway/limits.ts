import { authModels, type Authenticator, requireAuthenticated } from '@backend/gateway/auth'
import { standardErrors, apiErrorModels } from '@backend/gateway/errors'
import { accountEnumModels } from '@backend/gateway/models'
import { rateLimitGuard, type RateLimiter } from '@backend/gateway/rate-limit'
import { RATE_LIMITS } from '@backend/utils/rate-limits'
import { UserRole } from '@gmdb/contract'
import { Elysia, t } from 'elysia'

const { LimitType: limitTypeSchema } = accountEnumModels

export const limitModels = {
  ChangeLimitDTO: t.Object({
    name: limitTypeSchema,
    quantity: t.Number({ minimum: 1, multipleOf: 1 }),
  }),
  LimitEntity: t.Object({
    name: limitTypeSchema,
    quantity: t.Number(),
  }),
}

export type ChangeLimitInput = typeof limitModels.ChangeLimitDTO.static
export type Limit = typeof limitModels.LimitEntity.static

export interface LimitsService {
  change(input: ChangeLimitInput): Promise<Limit>
}

export interface LimitRouteDeps {
  limits: LimitsService
  auth: Authenticator
  rateLimit: RateLimiter
}

const ADMIN = [UserRole.ADMIN] as const

export function limitRoutes({ limits, auth, rateLimit }: LimitRouteDeps) {
  const limit = rateLimitGuard(rateLimit)

  return new Elysia({ name: 'limits' })
    .model({ ...apiErrorModels, ...authModels, ...accountEnumModels, ...limitModels })
    .post(
      '/limits',
      async (ctx) => {
        await limit(ctx, RATE_LIMITS.write)

        await requireAuthenticated(auth, ctx.request, ADMIN)

        return await limits.change(ctx.body as Limit)
      },
      {
        body: 'ChangeLimitDTO' as const,
        response: {
          200: 'LimitEntity' as const,
          ...standardErrors(),
        },
      },
    )
}
