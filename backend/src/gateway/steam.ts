import {
  authModels,
  requireRole,
  requireUser,
  resolveUser,
  type Authenticator,
} from '@backend/gateway/auth'
import { standardErrors, apiErrorModels } from '@backend/gateway/errors'
import { likeModels } from '@backend/gateway/likes'
import { recordEnumModels } from '@backend/gateway/models'
import { enforceRateLimit, type RateLimiter } from '@backend/gateway/rate-limit'
import { recordModels, type GatewayRecord } from '@backend/gateway/records'
import { RATE_LIMITS } from '@backend/utils/rate-limits'
import { Elysia, t } from 'elysia'
import type { RecordGrade, RecordStatus } from '@gmdb/contract'

const { RecordGrade: recordGradeSchema, RecordStatus: recordStatusSchema } = recordEnumModels
const { RecordEntity } = recordModels

export const SteamGameDto = t.Object({
  appid: t.Number(),
  name: t.String(),
  img_icon_url: t.String(),
  header_image: t.String(),
  playtime_forever: t.Number(),
})

export const SteamImportGameDto = t.Object({
  appId: t.Number(),
  status: recordStatusSchema,
  grade: t.Optional(t.Nullable(recordGradeSchema)),
})

export const SteamImportFailureDto = t.Object({
  appId: t.Number(),
  reason: t.String(),
})

export const steamModels = {
  SteamGameDto,
  SteamGamesResponseDTO: t.Object({
    games: t.Array(SteamGameDto),
    existingAppIds: t.Array(t.String()),
  }),
  SteamImportGameDto,
  SteamImportDTO: t.Object({
    games: t.Array(SteamImportGameDto),
  }),
  SteamImportFailureDto,
  SteamImportResultDTO: t.Object({
    created: t.Array(RecordEntity),
    failed: t.Array(SteamImportFailureDto),
  }),
}

export interface SteamGame {
  appid: number
  name: string
  img_icon_url: string
  header_image: string
  playtime_forever: number
}

export interface SteamImportGame {
  appId: number
  status: RecordStatus
  grade?: RecordGrade | null | undefined
}

export interface SteamGamesPage {
  games: SteamGame[]
  existingAppIds: string[]
}

export interface SteamImportResult {
  created: GatewayRecord[]
  failed: { appId: number; reason: string }[]
}

export interface SteamPort {
  getGames(): Promise<SteamGamesPage>
  importGames(games: SteamImportGame[], userId: string): Promise<SteamImportResult>
}

export interface SteamRouteDeps {
  steam: SteamPort
  auth: Authenticator
  rateLimit: RateLimiter
}

const ADMIN = ['ADMIN'] as const

export function steamRoutes({ steam, auth, rateLimit }: SteamRouteDeps) {
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

  const requireAdmin = async (request: Request) =>
    requireRole(requireUser(await resolveUser(auth, request)), ADMIN)

  return new Elysia({ name: 'steam' })
    .model({
      ...apiErrorModels,
      ...authModels,
      ...recordEnumModels,
      ...recordModels,
      ...likeModels,
      ...steamModels,
    })
    .get(
      '/steam/games',
      async (ctx) => {
        await limit(ctx, 'SteamController.getSteamGames', RATE_LIMITS.public)
        await requireAdmin(ctx.request)

        return await steam.getGames()
      },
      {
        response: { 200: 'SteamGamesResponseDTO' as const, ...standardErrors() },
      },
    )
    .post(
      '/steam/import',
      async (ctx) => {
        await limit(ctx, 'SteamController.importSteamGames', RATE_LIMITS.write)
        const user = await requireAdmin(ctx.request)
        ctx.set.status = 201

        return await steam.importGames((ctx.body as { games: SteamImportGame[] }).games, user.id)
      },
      {
        body: 'SteamImportDTO' as const,
        response: { 201: 'SteamImportResultDTO' as const, ...standardErrors() },
      },
    )
}
