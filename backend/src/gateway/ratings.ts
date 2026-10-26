import {
  authModels,
  requireRole,
  requireUser,
  resolveUser,
  type Authenticator,
} from '@backend/gateway/auth'
import { standardErrors, apiErrorModels } from '@backend/gateway/errors'
import { recordEnumModels } from '@backend/gateway/models'
import { coerceQueryNumbers, collectArrayQuery } from '@backend/gateway/query'
import { enforceRateLimit, type RateLimiter } from '@backend/gateway/rate-limit'
import { recordModels } from '@backend/gateway/records'
import { RATE_LIMITS } from '@backend/utils/rate-limits'
import { Elysia, t } from 'elysia'
import type { RateLimitConfig } from '@backend/utils/rate-limits'
import type { RecordGrade } from '@gmdb/contract'

const { RecordGrade: recordGradeSchema } = recordEnumModels
const { UserEntity } = authModels
const { RecordEntity } = recordModels

export const RatingEntity = t.Object({
  id: t.String(),
  userId: t.String(),
  recordId: t.Number(),
  grade: recordGradeSchema,
  user: t.Optional(t.Nullable(UserEntity)),
  createdAt: t.String(),
  updatedAt: t.String(),
})

export const UserRatedRecordEntity = t.Object({
  ...RecordEntity.properties,
  userGrade: recordGradeSchema,
  userLogin: t.String(),
})

export const FriendsMemberEntity = t.Object({
  userId: t.String(),
  login: t.String(),
  profileImageUrl: t.String(),
  avatarFrameId: t.Nullable(t.String()),
  counts: t.Record(t.String(), t.Number()),
  total: t.Number(),
})

export const ratingModels = {
  RatingUpsertDTO: t.Object({
    grade: recordGradeSchema,
  }),
  RatingEntity,
  UserRatedRecordEntity,
  GetUserRatingsEntity: t.Object({
    items: t.Array(UserRatedRecordEntity),
    total: t.Number(),
  }),
  FriendsMemberEntity,
  GetFriendsEntity: t.Object({
    members: t.Array(FriendsMemberEntity),
  }),
}

export interface RatingUpsertInput {
  grade: RecordGrade
}

export interface RatingsQuery {
  page?: number | undefined
  limit?: number | undefined
  grade?: RecordGrade[] | undefined
}

export type Rating = typeof RatingEntity.static
export type RatedRecord = typeof UserRatedRecordEntity.static
export type RatingsPage = typeof ratingModels.GetUserRatingsEntity.static
export type Friends = typeof ratingModels.GetFriendsEntity.static
export type FriendMember = typeof FriendsMemberEntity.static

export interface RatingsService {
  rate(userId: string, recordId: number, grade: RecordGrade): Promise<Rating>
  unrate(userId: string, recordId: number): Promise<void>
  getMy(userId: string, query: RatingsQuery): Promise<RatingsPage>
  getUser(viewerId: string | undefined, userId: string, query: RatingsQuery): Promise<RatingsPage>
  getFriends(): Promise<Friends>
}

export interface RatingRouteDeps {
  ratings: RatingsService
  auth: Authenticator
  rateLimit: RateLimiter
}

const USER_ROLES = ['USER', 'ADMIN'] as const
const RATER_ROLES = ['USER'] as const

export function ratingRoutes({ ratings, auth, rateLimit }: RatingRouteDeps) {
  const limit = (
    request: Request,
    server: { requestIP: (r: Request) => { address: string } | null } | null,
    route: string,
    config: RateLimitConfig,
  ) =>
    enforceRateLimit(rateLimit, {
      request,
      route,
      config,
      ip: server?.requestIP(request)?.address,
    })

  const querySchema = t.Object({
    grade: t.Optional(t.Array(recordGradeSchema)),
    page: t.Optional(t.Number({ minimum: 1, maximum: 10_000, multipleOf: 1 })),
    limit: t.Optional(t.Number({ minimum: 1, maximum: 100, multipleOf: 1 })),
  })

  return new Elysia({ name: 'ratings' })
    .model({
      ...apiErrorModels,
      ...authModels,
      ...recordEnumModels,
      ...recordModels,
      ...ratingModels,
    })
    .onTransform(({ request, query }) => {
      const values = query as Record<string, unknown>
      collectArrayQuery(request, values, ['grade'])
      coerceQueryNumbers(request, values, ['page', 'limit'])
    })
    .put(
      '/ratings/:recordId',
      async (ctx) => {
        await limit(ctx.request, ctx.server, 'RatingController.rate', RATE_LIMITS.like)
        const user = requireRole(requireUser(await resolveUser(auth, ctx.request)), RATER_ROLES)

        return await ratings.rate(
          user.id,
          ctx.params.recordId,
          (ctx.body as RatingUpsertInput).grade,
        )
      },
      {
        params: t.Object({ recordId: t.Number() }),
        body: 'RatingUpsertDTO' as const,
        response: {
          200: 'RatingEntity' as const,
          ...standardErrors(),
        },
      },
    )
    .delete(
      '/ratings/:recordId',
      async (ctx) => {
        await limit(ctx.request, ctx.server, 'RatingController.unrate', RATE_LIMITS.like)
        const user = requireRole(requireUser(await resolveUser(auth, ctx.request)), RATER_ROLES)

        await ratings.unrate(user.id, ctx.params.recordId)
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
      '/ratings/my',
      async (ctx) => {
        await limit(ctx.request, ctx.server, 'RatingController.getMyRatings', RATE_LIMITS.public)
        const user = requireRole(requireUser(await resolveUser(auth, ctx.request)), USER_ROLES)

        return await ratings.getMy(user.id, ctx.query as RatingsQuery)
      },
      {
        query: querySchema,
        response: {
          200: 'GetUserRatingsEntity' as const,
          ...standardErrors(),
        },
      },
    )
    .get(
      '/ratings/users/:id',
      async (ctx) => {
        await limit(ctx.request, ctx.server, 'RatingController.getUserRatings', RATE_LIMITS.public)
        const viewer = await resolveUser(auth, ctx.request)

        return await ratings.getUser(viewer?.id, ctx.params.id, ctx.query as RatingsQuery)
      },
      {
        params: t.Object({ id: t.String() }),
        query: querySchema,
        response: {
          200: 'GetUserRatingsEntity' as const,
          ...standardErrors(),
        },
      },
    )
    .get(
      '/ratings/friends',
      async (ctx) => {
        await limit(ctx.request, ctx.server, 'RatingController.getFriends', RATE_LIMITS.public)

        return await ratings.getFriends()
      },
      {
        response: {
          200: 'GetFriendsEntity' as const,
          ...standardErrors(),
        },
      },
    )
}
