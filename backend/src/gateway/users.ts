import {
  UserEntity,
  authModels,
  type Authenticator,
  type GatewayUser,
  requireAuthenticated,
} from '@backend/gateway/auth'
import { standardErrors, apiErrorModels } from '@backend/gateway/errors'
import { accountEnumModels } from '@backend/gateway/models'
import { rateLimitGuard, type RateLimiter } from '@backend/gateway/rate-limit'
import { NotFoundError } from '@backend/utils/errors'
import { RATE_LIMITS } from '@backend/utils/rate-limits'
import { UserRole, type AccountPlatform } from '@gmdb/contract'
import { Elysia, t } from 'elysia'

const { AccountPlatform: accountPlatformSchema } = accountEnumModels

const UserAccountEntitySchema = t.Object({
  id: t.Number(),
  userId: t.String(),
  platform: accountPlatformSchema,
  platformUserId: t.String(),
  platformLogin: t.String(),
  platformAvatar: t.Nullable(t.String()),
  createdAt: t.String(),
})

export const userModels = {
  UserAccountEntity: UserAccountEntitySchema,
  MergeUsersDto: t.Object({
    sourceUserId: t.String({ minLength: 1 }),
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

export interface UserAccount {
  id: number
  userId: string
  platform: AccountPlatform
  platformUserId: string
  platformLogin: string
  platformAvatar: string | null
  createdAt: string
}

export interface MergeResult {
  accountsMoved: number
  accountsDropped: number
  likesMoved: number
  likesDropped: number
  ratingsMoved: number
  ratingsDropped: number
  suggestionsMoved: number
  wordleGamesMoved: number
  wordleGamesDropped: number
}
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

const ADMIN = [UserRole.ADMIN] as const

export function userRoutes({ users, auth, rateLimit }: UserRouteDeps) {
  const limit = rateLimitGuard(rateLimit)

  return new Elysia({ name: 'users' })
    .model({
      ...apiErrorModels,
      ...authModels,
      ...accountEnumModels,
      ...userModels,
    })
    .get(
      '/users/users',
      async (ctx) => {
        await limit(ctx, RATE_LIMITS.public)

        return await users.getAll()
      },
      {
        response: {
          200: t.Array(UserEntity),
          ...standardErrors(),
        },
      },
    )
    .get(
      '/users/:id/accounts',
      async (ctx) => {
        await limit(ctx, RATE_LIMITS.public)
        await requireAuthenticated(auth, ctx.request, ADMIN)

        return await users.getAccounts(ctx.params.id)
      },
      {
        params: t.Object({ id: t.String() }),
        response: {
          200: t.Array(UserAccountEntitySchema),
          ...standardErrors(),
        },
      },
    )
    .get(
      '/users/:id',
      async (ctx) => {
        await limit(ctx, RATE_LIMITS.public)
        await requireAuthenticated(auth, ctx.request, ADMIN)

        const user = await users.getById(ctx.params.id)
        if (!user) throw new NotFoundError(`User ${ctx.params.id} not found`)

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
        await limit(ctx, RATE_LIMITS.write)
        await requireAuthenticated(auth, ctx.request, ADMIN)
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
        await limit(ctx, RATE_LIMITS.write)
        await requireAuthenticated(auth, ctx.request, ADMIN)
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
