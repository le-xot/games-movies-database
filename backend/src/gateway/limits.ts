import { Elysia, t } from 'elysia'
import {
  authModels,
  requireRole,
  requireUser,
  resolveUser,
  type Authenticator,
} from '@/gateway/auth'
import { apiErrorModels, standardErrors } from '@/gateway/errors'
import { accountEnumModels } from '@/gateway/models'
import { enforceRateLimit, type RateLimiter } from '@/gateway/rate-limit'
import { RATE_LIMITS } from '@/utils/rate-limits'
import type { LimitType } from '@gmdb/contract'

export const limitModels = {
  ChangeLimitDTO: t.Object({
    name: t.Ref('LimitType'),
    quantity: t.Number(),
  }),
  LimitEntity: t.Object({
    name: t.Ref('LimitType'),
    quantity: t.Number(),
  }),
}

export interface Limit {
  name: LimitType
  quantity: number
}

export interface LimitsService {
  change(input: Limit): Promise<Limit>
}

export interface LimitRouteDeps {
  limits: LimitsService
  auth: Authenticator
  rateLimit: RateLimiter
}

const ADMIN = ['ADMIN'] as const

export function limitRoutes({ limits, auth, rateLimit }: LimitRouteDeps) {
  return new Elysia({ name: 'limits' })
    .model({ ...apiErrorModels, ...authModels, ...accountEnumModels, ...limitModels })
    .post(
      '/limits',
      async (ctx) => {
        await enforceRateLimit(rateLimit, {
          request: ctx.request,
          route: 'LimitController.changeLimit',
          config: RATE_LIMITS.write,
          ip: ctx.server?.requestIP(ctx.request)?.address,
        })

        requireRole(requireUser(await resolveUser(auth, ctx.request)), ADMIN)

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
