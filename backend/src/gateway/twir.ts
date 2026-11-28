import { standardErrors, apiErrorModels } from '@backend/gateway/errors'
import { HTTP_URL_PATTERN } from '@backend/gateway/models'
import { rateLimitGuard, type RateLimiter } from '@backend/gateway/rate-limit'
import { suggestionModels, type SuggestionResponse } from '@backend/gateway/suggestions'
import { UnauthorizedError } from '@backend/utils/errors'
import { RATE_LIMITS } from '@backend/utils/rate-limits'
import { secretsMatch } from '@backend/utils/secrets'
import { Elysia, t } from 'elysia'

export const twirModels = {
  SuggestionCreateByTwirDTO: t.Object({
    userId: t.String(),
    link: t.String({ pattern: HTTP_URL_PATTERN }),
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
  const limit = rateLimitGuard(rateLimit)

  return new Elysia({ name: 'twir' })
    .model({ ...apiErrorModels, ...suggestionModels, ...twirModels })
    .post(
      '/twir/suggestion',
      async (ctx) => {
        await limit(ctx, RATE_LIMITS.twir)

        if (!secretsMatch(ctx.request.headers.get('x-api-key'), apiKey)) {
          throw new UnauthorizedError()
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
