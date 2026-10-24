import { standardErrors, ApiError, apiErrorModels } from '@backend/gateway/errors'
import { recordEnumModels } from '@backend/gateway/models'
import { enforceRateLimit, type RateLimiter } from '@backend/gateway/rate-limit'
import { suggestionModels, type SuggestionResponse } from '@backend/gateway/suggestions'
import { isApiKeyValid } from '@backend/utils/api-key'
import { RATE_LIMITS } from '@backend/utils/rate-limits'
import { Elysia, t } from 'elysia'

export const twirModels = {
  SuggestionCreateByTwirDTO: t.Object({
    userId: t.String(),
    link: t.String({ pattern: '^https?://\\S+$' }),
  }),
}

export interface TwirInput {
  userId: string
  link: string
}

export interface TwirService {
  createSuggestion(input: TwirInput): Promise<SuggestionResponse>
}

export interface TwirRouteDeps {
  twir: TwirService
  rateLimit: RateLimiter
  /** Ключ из `TWIR_API`. Пустой — доступ закрыт, как и в Nest-гварде. */
  apiKey: string | undefined
}

export function twirRoutes({ twir, rateLimit, apiKey }: TwirRouteDeps) {
  return new Elysia({ name: 'twir' })
    .model({ ...apiErrorModels, ...recordEnumModels, ...suggestionModels, ...twirModels })
    .post(
      '/twir/suggestion',
      async (ctx) => {
        await enforceRateLimit(rateLimit, {
          request: ctx.request,
          route: 'TwirController.createSuggestionWithTwir',
          config: RATE_LIMITS.twir,
          ip: ctx.server?.requestIP(ctx.request)?.address,
        })

        if (!isApiKeyValid(ctx.request.headers.get('x-api-key'), apiKey)) {
          throw new ApiError(401, 'Unauthorized')
        }

        return await twir.createSuggestion(ctx.body as TwirInput)
      },
      {
        body: 'SuggestionCreateByTwirDTO' as const,
        response: {
          200: 'UserSuggestionResponseDTO' as const,
          ...standardErrors(),
        },
      },
    )
}
