import {
  authModels,
  requireUser,
  resolveUser,
  type Authenticator,
  type GatewayUser,
} from '@backend/gateway/auth'
import { clearCookie } from '@backend/gateway/cookies'
import { standardErrors, ApiError, apiErrorModels } from '@backend/gateway/errors'
import { accountEnumModels, commonModels } from '@backend/gateway/models'
import { enforceRateLimit, type RateLimiter } from '@backend/gateway/rate-limit'
import { userModels, type UserAccount } from '@backend/gateway/users'
import { RATE_LIMITS } from '@backend/utils/rate-limits'
import { isAvatarFrameId } from '@gmdb/contract'
import { Elysia, t } from 'elysia'
import type { AccountPlatform } from '@gmdb/contract'

const MAX_AVATAR_BYTES = 5 * 1024 * 1024

const avatarFrameIdSchema = t.Nullable(t.String())

export const authSessionModels = {
  UpdateNicknameDTO: t.Object({
    login: t.String({ minLength: 2, maxLength: 32 }),
  }),
  // Что выбрано и что уже открыто: заблокированные рамки фронт показывает
  // с замком, поэтому список открытых едет вместе с выбором.
  CustomizationEntity: t.Object({
    avatarFrameId: avatarFrameIdSchema,
    unlockedAvatarFrameIds: t.Array(t.String()),
  }),
  // Отсутствие поля — «не менять», `null` — «сбросить». Id проверяются по
  // каталогу `@gmdb/contract` уже в роуте: `string` ещё ничего не гарантирует.
  CustomizationUpdateDTO: t.Object({
    avatarFrameId: t.Optional(t.Union([t.String(), t.Null()])),
  }),
}

export interface CustomizationUpdateInput {
  avatarFrameId?: string | null | undefined
}

export type GatewayCustomization = typeof authSessionModels.CustomizationEntity.static

export interface AuthSessionPort {
  getAccounts(userId: string): Promise<UserAccount[]>
  unlinkAccount(userId: string, platform: AccountPlatform): Promise<void>
  updateLogin(userId: string, login: string): Promise<GatewayUser>
  getCustomization(userId: string): Promise<GatewayCustomization>
  updateCustomization(userId: string, data: CustomizationUpdateInput): Promise<GatewayUser>
  deleteUser(userId: string): Promise<void>
  uploadAvatar(userId: string, buffer: Buffer): Promise<GatewayUser>
  deleteAvatar(userId: string): Promise<GatewayUser>
}

export interface AuthSessionRouteDeps {
  authSession: AuthSessionPort
  auth: Authenticator
  rateLimit: RateLimiter
}

export function authSessionRoutes({ authSession, auth, rateLimit }: AuthSessionRouteDeps) {
  const limit = (
    ctx: {
      request: Request
      server: { requestIP: (r: Request) => { address: string } | null } | null
    },
    route: string,
    config: Parameters<typeof enforceRateLimit>[1]['config'],
  ) =>
    enforceRateLimit(rateLimit, {
      request: ctx.request,
      route,
      config,
      ip: ctx.server?.requestIP(ctx.request)?.address,
    })

  const requireSession = async (request: Request) => requireUser(await resolveUser(auth, request))

  return new Elysia({ name: 'auth-session' })
    .model({
      ...apiErrorModels,
      ...authModels,
      ...accountEnumModels,
      ...userModels,
      ...authSessionModels,
      ...commonModels,
    })
    .get(
      '/auth/accounts',
      async (ctx) => {
        await limit(ctx, 'AuthController.getLinkedAccounts', RATE_LIMITS.public)

        return await authSession.getAccounts((await requireSession(ctx.request)).id)
      },
      {
        response: {
          200: t.Array(userModels.UserAccountEntity),
          ...standardErrors(),
        },
      },
    )
    .delete(
      '/auth/accounts/:platform',
      async (ctx) => {
        await limit(ctx, 'AuthController.unlinkAccount', RATE_LIMITS.write)
        const user = await requireSession(ctx.request)

        await authSession.unlinkAccount(user.id, ctx.params.platform as AccountPlatform)

        return { success: true }
      },
      {
        params: t.Object({
          platform: t.Union([t.Literal('TWITCH'), t.Literal('KICK'), t.Literal('TELEGRAM')]),
        }),
        response: {
          200: 'SuccessResponseDTO' as const,
          ...standardErrors(),
        },
      },
    )
    .patch(
      '/auth/me',
      async (ctx) => {
        await limit(ctx, 'AuthController.updateNickname', RATE_LIMITS.write)
        const user = await requireSession(ctx.request)

        return await authSession.updateLogin(user.id, (ctx.body as { login: string }).login)
      },
      {
        body: 'UpdateNicknameDTO' as const,
        response: {
          200: 'UserEntity' as const,
          ...standardErrors(),
        },
      },
    )
    .get(
      '/auth/me/customization',
      async (ctx) => {
        await limit(ctx, 'AuthController.getCustomization', RATE_LIMITS.public)
        const user = await requireSession(ctx.request)

        return await authSession.getCustomization(user.id)
      },
      {
        response: {
          200: 'CustomizationEntity' as const,
          ...standardErrors(),
        },
      },
    )
    .patch(
      '/auth/me/customization',
      async (ctx) => {
        await limit(ctx, 'AuthController.updateCustomization', RATE_LIMITS.write)
        const user = await requireSession(ctx.request)
        const body = ctx.body as CustomizationUpdateInput

        // Проверка по каталогу, а не только по типу: неизвестный/устаревший id
        // не должен доехать до БД.
        if (typeof body.avatarFrameId === 'string' && !isAvatarFrameId(body.avatarFrameId)) {
          throw new ApiError(400, 'Неизвестная рамка аватара')
        }

        return await authSession.updateCustomization(user.id, {
          avatarFrameId: body.avatarFrameId,
        })
      },
      {
        body: 'CustomizationUpdateDTO' as const,
        response: {
          200: 'UserEntity' as const,
          ...standardErrors(),
        },
      },
    )
    .delete(
      '/auth/me',
      async (ctx) => {
        await limit(ctx, 'AuthController.deleteMe', RATE_LIMITS.write)
        const user = await requireSession(ctx.request)

        await authSession.deleteUser(user.id)
        ctx.set.headers['set-cookie'] = clearCookie('token')

        return { success: true }
      },
      {
        response: {
          200: 'SuccessResponseDTO' as const,
          ...standardErrors(),
        },
      },
    )
    .post(
      '/auth/logout',
      async (ctx) => {
        await limit(ctx, 'AuthController.logout', RATE_LIMITS.auth)
        ctx.set.headers['set-cookie'] = clearCookie('token')
        // Именно `undefined`: `null` не проходит схему `t.Void()` и даёт 422.
        return undefined
      },
      {
        response: {
          200: t.Void(),
          ...standardErrors(),
        },
      },
    )
    .post(
      '/auth/me/avatar',
      async (ctx) => {
        await limit(ctx, 'AuthController.uploadAvatar', RATE_LIMITS.write)
        const user = await requireSession(ctx.request)

        // Elysia уже разобрала multipart в `ctx.body`: request.formData() здесь
        // бросает «Body already used».
        const file = (ctx.body as { file?: File }).file
        if (!(file instanceof File)) throw new ApiError(400, 'No file provided')
        if (!file.type.startsWith('image/')) {
          throw new ApiError(400, 'Only image files are allowed')
        }
        if (file.size > MAX_AVATAR_BYTES) throw new ApiError(400, 'File too large')

        return await authSession.uploadAvatar(user.id, Buffer.from(await file.arrayBuffer()))
      },
      {
        // Файл необязателен в схеме (как было в Nest), но без него — 400.
        body: t.Object({ file: t.Optional(t.File()) }),
        response: {
          200: 'UserEntity' as const,
          ...standardErrors(),
        },
      },
    )
    .delete(
      '/auth/me/avatar',
      async (ctx) => {
        await limit(ctx, 'AuthController.deleteAvatar', RATE_LIMITS.write)
        const user = await requireSession(ctx.request)

        return await authSession.deleteAvatar(user.id)
      },
      {
        response: {
          200: 'UserEntity' as const,
          ...standardErrors(),
        },
      },
    )
}
