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
import { collectArrayQuery } from '@/gateway/query'
import { enforceRateLimit, type RateLimiter } from '@/gateway/rate-limit'
import { RATE_LIMITS } from '@/utils/rate-limits'
import type { RateLimitConfig } from '@/utils/rate-limits'
import type { RecordGenre, RecordGrade, RecordStatus, RecordType } from '@gmdb/contract'

export const recordModels = {
  SuggestionOwnershipEntity: t.Object({
    id: t.Number(),
    recordId: t.Number(),
    userId: t.String(),
    user: t.Optional(t.Nullable(t.Ref('UserEntity'))),
    createdAt: t.String(),
  }),
  RecordEntity: t.Object({
    id: t.Number(),
    title: t.String(),
    link: t.String(),
    posterUrl: t.String(),
    status: t.Nullable(t.Ref('RecordStatus')),
    type: t.Nullable(t.Ref('RecordType')),
    genre: t.Nullable(t.Ref('RecordGenre')),
    grade: t.Nullable(t.Ref('RecordGrade')),
    friendsCounts: t.Optional(t.Nullable(t.Object({}))),
    friendsTotal: t.Optional(t.Nullable(t.Number())),
    friendsTop: t.Optional(t.Nullable(t.Ref('RecordGrade'))),
    myGrade: t.Optional(t.Nullable(t.Ref('RecordGrade'))),
    episode: t.Nullable(t.String()),
    extra: t.Optional(t.Nullable(t.Object({}))),
    likes: t.Optional(t.Nullable(t.Array(t.Ref('LikeEntity')))),
    suggestionOwnership: t.Optional(t.Nullable(t.Ref('SuggestionOwnershipEntity'))),
    createdAt: t.String(),
  }),
  GetAllRecordsDTO: t.Object({
    records: t.Array(t.Ref('RecordEntity')),
    total: t.Number(),
  }),
  RecordCreateFromLinkDTO: t.Object({
    link: t.String(),
    status: t.Optional(t.Ref('RecordStatus')),
    type: t.Optional(t.Ref('RecordType')),
  }),
  RecordUpdateDTO: t.Object({
    status: t.Optional(t.Ref('RecordStatus')),
    grade: t.Optional(t.Nullable(t.Ref('RecordGrade'))),
    episode: t.Optional(t.String()),
    type: t.Optional(t.Ref('RecordType')),
  }),
  RecordUpdatePosterDTO: t.Object({
    url: t.String(),
  }),
}

/**
 * Типы входов описываем руками, а не через `.static` TypeBox: `t.Ref('X')` даёт
 * `unknown` в типе (имя разрешается только в рантайме через реестр моделей).
 * Здесь важна точность — это граница с доменом.
 */
export interface RecordCreateInput {
  link: string
  status?: RecordStatus | undefined
  type?: RecordType | undefined
}

export interface RecordUpdateInput {
  status?: RecordStatus | undefined
  grade?: RecordGrade | null | undefined
  episode?: string | undefined
  type?: RecordType | undefined
}

export interface RecordUpdatePosterInput {
  url: string
}

export interface RecordsQuery {
  page?: number | undefined
  limit?: number | undefined
  orderBy?: 'id' | 'title' | undefined
  direction?: 'asc' | 'desc' | undefined
  status?: RecordStatus[] | undefined
  type?: RecordType | undefined
  genre?: RecordGenre | undefined
  grade?: RecordGrade[] | undefined
  search?: string | undefined
  viewerId?: string | undefined
}

export type GatewayRecord = typeof recordModels.RecordEntity.static
export type RecordsPage = typeof recordModels.GetAllRecordsDTO.static

/** Что гейтвею нужно от домена записей. */
export interface RecordsService {
  createFromLink(data: RecordCreateInput): Promise<GatewayRecord>
  findById(id: number, viewerId: string | undefined): Promise<GatewayRecord>
  patch(id: number, data: RecordUpdateInput): Promise<GatewayRecord>
  updatePoster(id: number, url: string): Promise<GatewayRecord>
  remove(id: number): Promise<void>
  getAll(query: RecordsQuery): Promise<RecordsPage>
}

export interface RecordRouteDeps {
  records: RecordsService
  auth: Authenticator
  rateLimit: RateLimiter
}

const ADMIN = ['ADMIN'] as const
const ARRAY_QUERY_KEYS = ['status', 'grade'] as const

export function recordRoutes({ records, auth, rateLimit }: RecordRouteDeps) {
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

  return new Elysia({ name: 'records' })
    .model({
      ...apiErrorModels,
      ...authModels,
      ...recordEnumModels,
      ...recordModels,
      ...likeModels,
    })
    .onTransform(({ request, query }) => {
      collectArrayQuery(request, query as Record<string, unknown>, ARRAY_QUERY_KEYS)
    })
    .post(
      '/records/link',
      async (ctx) => {
        await limit(
          ctx.request,
          ctx.server,
          'RecordController.createRecordFromLink',
          RATE_LIMITS.write,
        )
        requireRole(requireUser(await resolveUser(auth, ctx.request)), ADMIN)
        ctx.set.status = 201

        return await records.createFromLink(ctx.body as RecordCreateInput)
      },
      {
        body: 'RecordCreateFromLinkDTO' as const,
        response: {
          201: 'RecordEntity' as const,
          ...standardErrors(),
        },
      },
    )
    .get(
      '/records',
      async (ctx) => {
        await limit(ctx.request, ctx.server, 'RecordController.getAllRecords', RATE_LIMITS.public)
        const viewer = await resolveUser(auth, ctx.request)

        return await records.getAll({
          ...(ctx.query as Omit<RecordsQuery, 'viewerId'>),
          viewerId: viewer?.id,
        })
      },
      {
        query: t.Object({
          status: t.Optional(t.Array(t.Ref('RecordStatus'))),
          type: t.Optional(t.Ref('RecordType')),
          genre: t.Optional(t.Ref('RecordGenre')),
          grade: t.Optional(t.Array(t.Ref('RecordGrade'))),
          search: t.Optional(t.String()),
          page: t.Optional(t.Number()),
          limit: t.Optional(t.Number()),
          orderBy: t.Optional(t.Union([t.Literal('id'), t.Literal('title')])),
          direction: t.Optional(t.Union([t.Literal('asc'), t.Literal('desc')])),
        }),
        response: {
          200: 'GetAllRecordsDTO' as const,
          ...standardErrors(),
        },
      },
    )
    .get(
      '/records/:id',
      async (ctx) => {
        await limit(ctx.request, ctx.server, 'RecordController.findRecordById', RATE_LIMITS.public)
        const user = requireRole(requireUser(await resolveUser(auth, ctx.request)), ADMIN)

        return await records.findById(ctx.params.id, user.id)
      },
      {
        params: t.Object({ id: t.Number() }),
        response: {
          200: 'RecordEntity' as const,
          ...standardErrors(),
        },
      },
    )
    .patch(
      '/records/:id',
      async (ctx) => {
        await limit(ctx.request, ctx.server, 'RecordController.patchRecord', RATE_LIMITS.write)
        requireRole(requireUser(await resolveUser(auth, ctx.request)), ADMIN)

        return await records.patch(ctx.params.id, ctx.body as RecordUpdateInput)
      },
      {
        params: t.Object({ id: t.Number() }),
        body: 'RecordUpdateDTO' as const,
        response: {
          200: 'RecordEntity' as const,
          ...standardErrors(),
        },
      },
    )
    .patch(
      '/records/:id/poster',
      async (ctx) => {
        await limit(ctx.request, ctx.server, 'RecordController.updatePoster', RATE_LIMITS.write)
        requireRole(requireUser(await resolveUser(auth, ctx.request)), ADMIN)

        return await records.updatePoster(ctx.params.id, (ctx.body as RecordUpdatePosterInput).url)
      },
      {
        params: t.Object({ id: t.Number() }),
        body: 'RecordUpdatePosterDTO' as const,
        response: {
          200: 'RecordEntity' as const,
          ...standardErrors(),
        },
      },
    )
    .delete(
      '/records/:id',
      async (ctx) => {
        await limit(ctx.request, ctx.server, 'RecordController.deleteRecord', RATE_LIMITS.write)
        requireRole(requireUser(await resolveUser(auth, ctx.request)), ADMIN)
        ctx.set.status = 204

        await records.remove(ctx.params.id)
      },
      {
        params: t.Object({ id: t.Number() }),
        response: {
          204: t.Void(),
          ...standardErrors(),
        },
      },
    )
}
