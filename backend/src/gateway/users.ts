import { Elysia, t } from 'elysia'
import {
  authModels,
  requireRole,
  requireUser,
  resolveUser,
  type Authenticator,
  type GatewayUser,
} from '@/gateway/auth'
import { ApiError, apiErrorModels, standardErrors } from '@/gateway/errors'
import { accountEnumModels, recordEnumModels } from '@/gateway/models'
import { enforceRateLimit, type RateLimiter } from '@/gateway/rate-limit'
import { RATE_LIMITS } from '@/utils/rate-limits'

export const userModels = {
  UserAccountEntity: t.Object({
    id: t.Number(),
    userId: t.String(),
    platform: t.Ref('AccountPlatform'),
    platformUserId: t.String(),
    platformLogin: t.String(),
    platformAvatar: t.Nullable(t.String()),
    createdAt: t.String(),
  }),
  MergeUsersDto: t.Object({
    sourceUserId: t.String(),
  }),
  MergeUsersResultEntity: t.Object({
    accountsMoved: t.Number(),
    accountsDropped: t.Number(),
    likesMoved: t.Number(),
    likesDropped: t.Number(),
    ratingsMoved: t.Number(),
    ratingsDropped: t.Number(),
    suggestionsMoved: t.Number(),
    wordleGamesMoved: t.Number(),
    wordleGamesDropped: t.Number(),
  }),
}

export type UserAccount = typeof userModels.UserAccountEntity.static
export type MergeResult = typeof userModels.MergeUsersResultEntity.static
export interface MergeInput {
  sourceUserId: string
}

/** Что гейтвею нужно от домена пользователей. */
export interface UsersService {
  getAll(): Promise<GatewayUser[]>
  getById(id: string): Promise<GatewayUser | null>
  getAccounts(id: string): Promise<UserAccount[]>
  remove(id: string): Promise<void>
  merge(targetId: string, sourceUserId: string): Promise<MergeResult>
}

export interface UserRouteDeps {
  users: UsersService
  auth: Authenticator
  rateLimit: RateLimiter
}

const ADMIN = ['ADMIN'] as const

export function userRoutes({ users, auth, rateLimit }: UserRouteDeps) {
  const limit = (
    request: Request,
    server: { requestIP: (r: Request) => { address: string } | null } | null,
    route: string,
    config: Parameters<typeof enforceRateLimit>[1]['config'],
  ) =>
    enforceRateLimit(rateLimit, { request, route, config, ip: server?.requestIP(request)?.address })

  return new Elysia({ name: 'users' })
    .model({
      ...apiErrorModels,
      ...authModels,
      ...accountEnumModels,
      ...recordEnumModels,
      ...userModels,
    })
    .get(
      '/users/users',
      async (ctx) => {
        await limit(ctx.request, ctx.server, 'UserController.getAllUsers', RATE_LIMITS.public)

        return await users.getAll()
      },
      {
        response: {
          200: t.Array(t.Ref('UserEntity')),
          ...standardErrors(),
        },
      },
    )
    .get(
      '/users/:id/accounts',
      async (ctx) => {
        await limit(ctx.request, ctx.server, 'UserController.getUserAccounts', RATE_LIMITS.public)
        requireRole(requireUser(await resolveUser(auth, ctx.request)), ADMIN)

        return await users.getAccounts(ctx.params.id)
      },
      {
        params: t.Object({ id: t.String() }),
        response: {
          200: t.Array(t.Ref('UserAccountEntity')),
          ...standardErrors(),
        },
      },
    )
    .get(
      '/users/:id',
      async (ctx) => {
        await limit(ctx.request, ctx.server, 'UserController.getUserById', RATE_LIMITS.public)
        requireRole(requireUser(await resolveUser(auth, ctx.request)), ADMIN)

        const user = await users.getById(ctx.params.id)
        if (!user) throw new ApiError(404, `User ${ctx.params.id} not found`)

        return user
      },
      {
        params: t.Object({ id: t.String() }),
        response: {
          200: 'UserEntity' as const,
          ...standardErrors(),
        },
      },
    )
    .delete(
      '/users/:id',
      async (ctx) => {
        await limit(ctx.request, ctx.server, 'UserController.deleteUser', RATE_LIMITS.write)
        requireRole(requireUser(await resolveUser(auth, ctx.request)), ADMIN)
        ctx.set.status = 204

        await users.remove(ctx.params.id)
      },
      {
        params: t.Object({ id: t.String() }),
        response: {
          204: t.Void(),
          ...standardErrors(),
        },
      },
    )
    .post(
      '/users/:id/merge',
      async (ctx) => {
        await limit(ctx.request, ctx.server, 'UserController.mergeUsers', RATE_LIMITS.write)
        requireRole(requireUser(await resolveUser(auth, ctx.request)), ADMIN)
        ctx.set.status = 201

        return await users.merge(ctx.params.id, (ctx.body as MergeInput).sourceUserId)
      },
      {
        params: t.Object({ id: t.String() }),
        body: 'MergeUsersDto' as const,
        response: {
          201: 'MergeUsersResultEntity' as const,
          ...standardErrors(),
        },
      },
    )
}
