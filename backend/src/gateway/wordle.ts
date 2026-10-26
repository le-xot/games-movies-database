import {
  authModels,
  requireRole,
  requireUser,
  resolveUser,
  type Authenticator,
} from '@backend/gateway/auth'
import { standardErrors, apiErrorModels, publicErrors } from '@backend/gateway/errors'
import { enforceRateLimit, type RateLimiter } from '@backend/gateway/rate-limit'
import { RATE_LIMITS } from '@backend/utils/rate-limits'
import { Elysia, t } from 'elysia'
import type { WordleGameStatus, WordleHistoryStatus, WordleLetterState } from '@gmdb/contract'

export const wordleModels = {
  WordleGameStatus: t.Union([t.Literal('IN_PROGRESS'), t.Literal('WON'), t.Literal('LOST')]),
  WordleLetterState: t.Union([t.Literal('CORRECT'), t.Literal('PRESENT'), t.Literal('ABSENT')]),
  WordleHistoryStatus: t.Union([t.Literal('WON'), t.Literal('LOST'), t.Literal('NONE')]),
  WordleGuessDTO: t.Object({
    word: t.String(),
  }),
  WordleGuessStateDTO: t.Object({
    word: t.String(),
    states: t.Array(t.Ref('WordleLetterState')),
  }),
  WordleDailyGuessDTO: t.Object({
    states: t.Array(t.Ref('WordleLetterState')),
  }),
  WordleStateDTO: t.Object({
    date: t.String(),
    status: t.Ref('WordleGameStatus'),
    attempts: t.Number(),
    maxAttempts: t.Number(),
    wordLength: t.Number(),
    guesses: t.Array(t.Ref('WordleGuessStateDTO')),
    answer: t.Nullable(t.String()),
    msUntilNextWord: t.Number(),
  }),
  WordleHistoryDayDTO: t.Object({
    date: t.String(),
    status: t.Ref('WordleHistoryStatus'),
  }),
  WordleStatsDTO: t.Object({
    played: t.Number(),
    wins: t.Number(),
    winRate: t.Number(),
    currentStreak: t.Number(),
    maxStreak: t.Number(),
    distribution: t.Array(t.Number()),
    totalPlayers: t.Number(),
    rank: t.Nullable(t.Number()),
    history: t.Array(t.Ref('WordleHistoryDayDTO')),
  }),
  WordleLeaderboardEntryDTO: t.Object({
    userId: t.String(),
    login: t.String(),
    profileImageUrl: t.String(),
    color: t.String(),
    avatarFrameId: t.Nullable(t.String()),
    activeBadgeId: t.Nullable(t.String()),
    wins: t.Number(),
    avgAttempts: t.Number(),
    currentStreak: t.Number(),
    maxStreak: t.Number(),
  }),
  WordleDailyLeaderboardEntryDTO: t.Object({
    userId: t.String(),
    login: t.String(),
    profileImageUrl: t.String(),
    color: t.String(),
    avatarFrameId: t.Nullable(t.String()),
    activeBadgeId: t.Nullable(t.String()),
    status: t.Ref('WordleGameStatus'),
    attempts: t.Number(),
    guesses: t.Array(t.Ref('WordleDailyGuessDTO')),
  }),
  WordleDailyLeaderboardDTO: t.Object({
    entries: t.Array(t.Ref('WordleDailyLeaderboardEntryDTO')),
    total: t.Number(),
  }),
  WordleLeaderboardDTO: t.Object({
    entries: t.Array(t.Ref('WordleLeaderboardEntryDTO')),
    totalPlayers: t.Number(),
    totalGames: t.Number(),
    winsToday: t.Number(),
    today: t.Ref('WordleDailyLeaderboardDTO'),
  }),
  WordlePracticeStateDTO: t.Object({
    status: t.Ref('WordleGameStatus'),
    attempts: t.Number(),
    maxAttempts: t.Number(),
    wordLength: t.Number(),
    guesses: t.Array(t.Ref('WordleGuessStateDTO')),
    answer: t.Nullable(t.String()),
  }),
}

export const wordleNotificationModels = {
  WordleNotificationsStatusDTO: t.Object({
    available: t.Boolean(),
    connected: t.Boolean(),
    morningEnabled: t.Boolean(),
    morningTime: t.String(),
    eveningEnabled: t.Boolean(),
    eveningTime: t.String(),
    telegramUsername: t.Nullable(t.String()),
  }),
  WordleNotificationsUpdateDTO: t.Object({
    morningEnabled: t.Optional(t.Boolean()),
    eveningEnabled: t.Optional(t.Boolean()),
  }),
  WordleNotificationsLinkDTO: t.Object({
    url: t.String(),
  }),
  WordleNotificationsDeleteDTO: t.Object({
    ok: t.Boolean(),
  }),
}

export interface WordleGuessState {
  word: string
  states: WordleLetterState[]
}

export interface WordleState {
  date: string
  status: WordleGameStatus
  attempts: number
  maxAttempts: number
  wordLength: number
  guesses: WordleGuessState[]
  answer: string | null
  msUntilNextWord: number
}

export interface WordleStats {
  played: number
  wins: number
  winRate: number
  currentStreak: number
  maxStreak: number
  distribution: number[]
  totalPlayers: number
  rank: number | null
  history: { date: string; status: WordleHistoryStatus }[]
}

export interface WordleLeaderboard {
  entries: {
    userId: string
    login: string
    profileImageUrl: string
    color: string
    avatarFrameId: string | null
    activeBadgeId: string | null
    wins: number
    avgAttempts: number
    currentStreak: number
    maxStreak: number
  }[]
  totalPlayers: number
  totalGames: number
  winsToday: number
  today: {
    entries: {
      userId: string
      login: string
      profileImageUrl: string
      color: string
      avatarFrameId: string | null
      activeBadgeId: string | null
      status: WordleGameStatus
      attempts: number
      guesses: { states: WordleLetterState[] }[]
    }[]
    total: number
  }
}

export interface WordlePracticeState {
  status: WordleGameStatus
  attempts: number
  maxAttempts: number
  wordLength: number
  guesses: WordleGuessState[]
  answer: string | null
}
export interface WordleNotificationStatus {
  available: boolean
  connected: boolean
  morningEnabled: boolean
  morningTime: string
  eveningEnabled: boolean
  eveningTime: string
  telegramUsername: string | null
}

export interface WordleNotificationLink {
  url: string
}

export interface WordleNotificationInput {
  morningEnabled?: boolean | undefined
  eveningEnabled?: boolean | undefined
}

export interface WordleServicePort {
  getState(userId: string): Promise<WordleState>
  makeGuess(userId: string, word: string): Promise<WordleState>
  getStats(userId: string): Promise<WordleStats>
  getLeaderboard(): Promise<WordleLeaderboard>
  getPracticeState(userId: string): Promise<WordlePracticeState | null>
  startPractice(userId: string): Promise<WordlePracticeState>
  makePracticeGuess(userId: string, word: string): Promise<WordlePracticeState>
}

export interface WordleNotificationsPort {
  getStatus(userId: string): Promise<WordleNotificationStatus>
  updateFlags(userId: string, input: WordleNotificationInput): Promise<WordleNotificationStatus>
  createLink(userId: string): Promise<WordleNotificationLink>
  disconnect(userId: string): Promise<void>
}

export interface WordleRouteDeps {
  wordle: WordleServicePort
  wordleNotifications: WordleNotificationsPort
  auth: Authenticator
  rateLimit: RateLimiter
}

const USER_ROLES = ['USER', 'ADMIN'] as const

export function wordleRoutes({ wordle, wordleNotifications, auth, rateLimit }: WordleRouteDeps) {
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

  const requirePlayer = async (request: Request) =>
    requireRole(requireUser(await resolveUser(auth, request)), USER_ROLES)

  const wordleModels_ = { ...apiErrorModels, ...authModels, ...wordleModels }

  return new Elysia({ name: 'wordle' })
    .model({ ...wordleModels_, ...wordleNotificationModels })
    .get(
      '/wordle/state',
      async (ctx) => {
        await limit(ctx, 'WordleController.getState', RATE_LIMITS.public)

        return await wordle.getState((await requirePlayer(ctx.request)).id)
      },
      {
        response: { 200: 'WordleStateDTO' as const, ...standardErrors() },
      },
    )
    .post(
      '/wordle/guess',
      async (ctx) => {
        await limit(ctx, 'WordleController.makeGuess', RATE_LIMITS.write)

        return await wordle.makeGuess(
          (await requirePlayer(ctx.request)).id,
          (ctx.body as { word: string }).word,
        )
      },
      {
        body: 'WordleGuessDTO' as const,
        response: { 200: 'WordleStateDTO' as const, ...standardErrors() },
      },
    )
    .get(
      '/wordle/stats',
      async (ctx) => {
        await limit(ctx, 'WordleController.getStats', RATE_LIMITS.public)

        return await wordle.getStats((await requirePlayer(ctx.request)).id)
      },
      {
        response: { 200: 'WordleStatsDTO' as const, ...standardErrors() },
      },
    )
    .get(
      '/wordle/leaderboard',
      async (ctx) => {
        await limit(ctx, 'WordleController.getLeaderboard', RATE_LIMITS.public)

        return await wordle.getLeaderboard()
      },
      {
        response: { 200: 'WordleLeaderboardDTO' as const, ...publicErrors() },
      },
    )
    .get(
      '/wordle/practice',
      async (ctx) => {
        await limit(ctx, 'WordleController.getPracticeState', RATE_LIMITS.public)

        const state = await wordle.getPracticeState((await requirePlayer(ctx.request)).id)

        // Elysia отдаёт `null` пустым телом, а Nest — телом `null`. Фронт
        // читает ответ как JSON, поэтому пустое тело — сломанный контракт.
        // Возвращаем готовый Response в обеих ветках: он обходит валидацию,
        // но схема всё равно описана и даёт типы фронту.
        if (state === null) {
          return new Response('null', { headers: { 'content-type': 'application/json' } })
        }

        return Response.json(state)
      },
      {
        response: {
          200: t.Nullable(t.Ref('WordlePracticeStateDTO')),
          ...standardErrors(),
        },
      },
    )
    .post(
      '/wordle/practice',
      async (ctx) => {
        await limit(ctx, 'WordleController.startPractice', RATE_LIMITS.wordlePractice)

        return await wordle.startPractice((await requirePlayer(ctx.request)).id)
      },
      {
        response: { 200: 'WordlePracticeStateDTO' as const, ...standardErrors() },
      },
    )
    .post(
      '/wordle/practice/guess',
      async (ctx) => {
        await limit(ctx, 'WordleController.makePracticeGuess', RATE_LIMITS.wordlePractice)

        return await wordle.makePracticeGuess(
          (await requirePlayer(ctx.request)).id,
          (ctx.body as { word: string }).word,
        )
      },
      {
        body: 'WordleGuessDTO' as const,
        response: { 200: 'WordlePracticeStateDTO' as const, ...standardErrors() },
      },
    )
    .get(
      '/wordle/notifications',
      async (ctx) => {
        await limit(ctx, 'WordleNotificationController.getStatus', RATE_LIMITS.public)

        return await wordleNotifications.getStatus((await requirePlayer(ctx.request)).id)
      },
      {
        response: { 200: 'WordleNotificationsStatusDTO' as const, ...standardErrors() },
      },
    )
    .patch(
      '/wordle/notifications',
      async (ctx) => {
        await limit(ctx, 'WordleNotificationController.update', RATE_LIMITS.public)

        return await wordleNotifications.updateFlags(
          (await requirePlayer(ctx.request)).id,
          ctx.body as WordleNotificationInput,
        )
      },
      {
        body: 'WordleNotificationsUpdateDTO' as const,
        response: { 200: 'WordleNotificationsStatusDTO' as const, ...standardErrors() },
      },
    )
    .post(
      '/wordle/notifications/link',
      async (ctx) => {
        await limit(ctx, 'WordleNotificationController.createLink', RATE_LIMITS.write)
        ctx.set.status = 201

        return await wordleNotifications.createLink((await requirePlayer(ctx.request)).id)
      },
      {
        response: { 201: 'WordleNotificationsLinkDTO' as const, ...standardErrors() },
      },
    )
    .delete(
      '/wordle/notifications',
      async (ctx) => {
        await limit(ctx, 'WordleNotificationController.remove', RATE_LIMITS.public)
        const user = await requirePlayer(ctx.request)

        await wordleNotifications.disconnect(user.id)

        return { ok: true }
      },
      {
        response: { 200: 'WordleNotificationsDeleteDTO' as const, ...standardErrors() },
      },
    )
}
