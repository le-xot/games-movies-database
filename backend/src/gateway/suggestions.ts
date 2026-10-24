import { Elysia, t } from 'elysia'
import {
  authModels,
  requireRole,
  requireUser,
  resolveUser,
  type Authenticator,
} from '@/gateway/auth'
import { apiErrorModels, standardErrors } from '@/gateway/errors'
import { likeModels } from '@/gateway/likes'
import { recordEnumModels } from '@/gateway/models'
import { enforceRateLimit, type RateLimiter } from '@/gateway/rate-limit'
import { recordModels, type GatewayRecord } from '@/gateway/records'
import { RATE_LIMITS } from '@/utils/rate-limits'
import type { RecordGenre } from '@gmdb/contract'

export const suggestionModels = {
  UserSuggestionDTO: t.Object({
    link: t.String(),
  }),
  UserSuggestionResponseDTO: t.Object({
    title: t.String(),
    genre: t.Ref('RecordGenre'),
  }),
}

export type SuggestionResponse = { title: string; genre: RecordGenre }

export interface CreateSuggestionInput {
  link: string
}

/** Что гейтвею нужно от домена предложений. */
export interface SuggestionsService {
  list(): Promise<GatewayRecord[]>
  create(input: CreateSuggestionInput & { userId: string }): Promise<SuggestionResponse>
  remove(id: number, userId: string): Promise<void>
}

export interface SuggestionRouteDeps {
  suggestions: SuggestionsService
  auth: Authenticator
  rateLimit: RateLimiter
}

const USER_ROLES = ['USER', 'ADMIN'] as const

export function suggestionRoutes({ suggestions, auth, rateLimit }: SuggestionRouteDeps) {
  const limit = (
    request: Request,
    server: { requestIP: (r: Request) => { address: string } | null } | null,
    route: string,
    config: Parameters<typeof enforceRateLimit>[1]['config'],
  ) =>
    enforceRateLimit(rateLimit, { request, route, config, ip: server?.requestIP(request)?.address })

  return new Elysia({ name: 'suggestions' })
    .model({
      ...apiErrorModels,
      ...authModels,
      ...recordEnumModels,
      ...recordModels,
      ...likeModels,
      ...suggestionModels,
    })
    .get(
      '/suggestions',
      async (ctx) => {
        await limit(
          ctx.request,
          ctx.server,
          'SuggestionController.getSuggestions',
          RATE_LIMITS.public,
        )

        return await suggestions.list()
      },
      {
        response: {
          200: t.Array(t.Ref('RecordEntity')),
          ...standardErrors(),
        },
      },
    )
    .post(
      '/suggestions',
      async (ctx) => {
        await limit(
          ctx.request,
          ctx.server,
          'SuggestionController.userSuggest',
          RATE_LIMITS.suggestion,
        )
        const user = requireRole(requireUser(await resolveUser(auth, ctx.request)), USER_ROLES)

        return await suggestions.create({
          link: (ctx.body as CreateSuggestionInput).link,
          userId: user.id,
        })
      },
      {
        body: 'UserSuggestionDTO' as const,
        response: {
          200: 'UserSuggestionResponseDTO' as const,
          ...standardErrors(),
        },
      },
    )
    .delete(
      '/suggestions/:id',
      async (ctx) => {
        await limit(
          ctx.request,
          ctx.server,
          'SuggestionController.deleteUserSuggestion',
          RATE_LIMITS.public,
        )
        const user = requireUser(await resolveUser(auth, ctx.request))

        await suggestions.remove(ctx.params.id, user.id)
      },
      {
        params: t.Object({ id: t.Number() }),
        response: {
          200: t.Void(),
          ...standardErrors(),
        },
      },
    )
}
