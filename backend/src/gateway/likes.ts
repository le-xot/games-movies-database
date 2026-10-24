import { Elysia, t } from 'elysia'
import {
  authModels,
  requireRole,
  requireUser,
  resolveUser,
  type Authenticator,
} from '@/gateway/auth'
import { apiErrorModels, standardErrors } from '@/gateway/errors'
import { enforceRateLimit, type RateLimiter } from '@/gateway/rate-limit'
import { RATE_LIMITS } from '@/utils/rate-limits'

export const likeModels = {
  LikeCreateDTO: t.Object({
    recordId: t.Number(),
  }),
  LikeEntity: t.Object({
    id: t.String(),
    userId: t.String(),
    recordId: t.Number(),
    user: t.Optional(t.Nullable(t.Ref('UserEntity'))),
    createdAt: t.String(),
  }),
  GetLikesByIdDTO: t.Object({
    likes: t.Array(t.Ref('LikeEntity')),
    total: t.Number(),
  }),
}

export type Like = typeof likeModels.LikeEntity.static
export type LikesPage = typeof likeModels.GetLikesByIdDTO.static

/** Что гейтвею нужно от домена лайков. */
export interface LikesService {
  createLike(userId: string, recordId: number): Promise<Like>
  deleteLike(userId: string, recordId: number): Promise<void>
  getLikesByRecordId(recordId: number): Promise<LikesPage>
  getLikesByUserId(userId: string): Promise<LikesPage>
  getLikes(page: number | undefined, limit: number | undefined): Promise<LikesPage>
}

export interface LikeRouteDeps {
  likes: LikesService
  auth: Authenticator
  rateLimit: RateLimiter
}

const USER_ROLES = ['USER', 'ADMIN'] as const

export function likeRoutes({ likes, auth, rateLimit }: LikeRouteDeps) {
  return new Elysia({ name: 'likes' })
    .model({ ...apiErrorModels, ...authModels, ...likeModels })
    .post(
      '/likes',
      async ({ request, server, body }) => {
        await enforceRateLimit(rateLimit, {
          request,
          route: 'LikeController.createLike',
          config: RATE_LIMITS.like,
          ip: server?.requestIP(request)?.address,
        })

        const user = requireRole(requireUser(await resolveUser(auth, request)), USER_ROLES)

        return await likes.createLike(user.id, body.recordId)
      },
      {
        body: 'LikeCreateDTO',
        response: {
          200: 'LikeEntity' as const,
          ...standardErrors(),
        },
      },
    )
    .delete(
      '/likes/:recordId',
      async ({ request, server, params }) => {
        await enforceRateLimit(rateLimit, {
          request,
          route: 'LikeController.deleteLike',
          config: RATE_LIMITS.like,
          ip: server?.requestIP(request)?.address,
        })

        const user = requireRole(requireUser(await resolveUser(auth, request)), USER_ROLES)

        await likes.deleteLike(user.id, params.recordId)
      },
      {
        params: t.Object({ recordId: t.Number() }),
        response: {
          200: t.Void(),
          ...standardErrors(),
        },
      },
    )
    .get(
      '/likes/records/:id',
      async ({ request, server, params }) => {
        await enforceRateLimit(rateLimit, {
          request,
          route: 'LikeController.getLikesByRecordId',
          config: RATE_LIMITS.public,
          ip: server?.requestIP(request)?.address,
        })

        requireRole(requireUser(await resolveUser(auth, request)), USER_ROLES)

        return await likes.getLikesByRecordId(params.id)
      },
      {
        params: t.Object({ id: t.Number() }),
        response: {
          200: 'GetLikesByIdDTO' as const,
          ...standardErrors(),
        },
      },
    )
    .get(
      '/likes/users/:id',
      async ({ request, server, params }) => {
        await enforceRateLimit(rateLimit, {
          request,
          route: 'LikeController.getLikesByUserId',
          config: RATE_LIMITS.public,
          ip: server?.requestIP(request)?.address,
        })

        requireRole(requireUser(await resolveUser(auth, request)), USER_ROLES)

        return await likes.getLikesByUserId(params.id)
      },
      {
        params: t.Object({ id: t.String() }),
        response: {
          200: 'GetLikesByIdDTO' as const,
          ...standardErrors(),
        },
      },
    )
    .get(
      '/likes/count',
      async ({ request, server, query }) => {
        await enforceRateLimit(rateLimit, {
          request,
          route: 'LikeController.getLikes',
          config: RATE_LIMITS.public,
          ip: server?.requestIP(request)?.address,
        })

        requireRole(requireUser(await resolveUser(auth, request)), USER_ROLES)

        return await likes.getLikes(query.page, query.limit)
      },
      {
        query: t.Object({
          page: t.Optional(t.Number()),
          limit: t.Optional(t.Number()),
        }),
        response: {
          200: 'GetLikesByIdDTO' as const,
          ...standardErrors(),
        },
      },
    )
}
