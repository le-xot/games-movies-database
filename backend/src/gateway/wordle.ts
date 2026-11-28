import { authModels, type Authenticator, requireAuthenticated } from '@backend/gateway/auth'
import { standardErrors, apiErrorModels, publicErrors } from '@backend/gateway/errors'
import { enumUnion } from '@backend/gateway/models'
import { rateLimitGuard, type RateLimiter } from '@backend/gateway/rate-limit'
import { RATE_LIMITS } from '@backend/utils/rate-limits'
import { UserRole, WordleGameStatus, WordleHistoryStatus, WordleLetterState } from '@gmdb/contract'
import { Elysia, t } from 'elysia'
import type {
  WordleNotificationLink,
  WordleNotificationStatus,
  WordleNotificationUpdate,
} from '@backend/modules/wordle/entities/wordle-notification.entity'
import type {
  WordleLeaderboard,
  WordlePracticeState,
  WordleState,
  WordleStats,
} from '@backend/modules/wordle/entities/wordle.entity'

export const wordleModels = {
  WordleGameStatus: enumUnion(WordleGameStatus),
  WordleLetterState: enumUnion(WordleLetterState),
  WordleHistoryStatus: enumUnion(WordleHistoryStatus),
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

// Порт и типы фронта: доменные формы Wordle (проводную форму держат модели выше).
export type {
  WordleGuessState,
  WordleLeaderboard,
  WordlePracticeState,
  WordleState,
  WordleStats,
} from '@backend/modules/wordle/entities/wordle.entity'
export type { WordleNotificationStatus } from '@backend/modules/wordle/entities/wordle-notification.entity'

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
  updateFlags(userId: string, input: WordleNotificationUpdate): Promise<WordleNotificationStatus>
  createLink(userId: string): Promise<WordleNotificationLink>
  disconnect(userId: string): Promise<void>
}

export interface WordleRouteDeps {
  wordle: WordleServicePort
  wordleNotifications: WordleNotificationsPort
  auth: Authenticator
  rateLimit: RateLimiter
}

const USER_ROLES = [UserRole.USER, UserRole.ADMIN] as const

export function wordleRoutes({ wordle, wordleNotifications, auth, rateLimit }: WordleRouteDeps) {
  const limit = rateLimitGuard(rateLimit)

  const requirePlayer = async (request: Request) =>
    await requireAuthenticated(auth, request, USER_ROLES)

  const wordleRouteModels = { ...apiErrorModels, ...authModels, ...wordleModels }

  return new Elysia({ name: 'wordle' })
    .model({ ...wordleRouteModels, ...wordleNotificationModels })
    .get(
      '/wordle/state',
      async (ctx) => {
        await limit(ctx, RATE_LIMITS.public)

        return await wordle.getState((await requirePlayer(ctx.request)).id)
      },
      {
        response: { 200: 'WordleStateDTO' as const, ...standardErrors() },
      },
    )
    .post(
      '/wordle/guess',
      async (ctx) => {
        await limit(ctx, RATE_LIMITS.write)

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
        await limit(ctx, RATE_LIMITS.public)

        return await wordle.getStats((await requirePlayer(ctx.request)).id)
      },
      {
        response: { 200: 'WordleStatsDTO' as const, ...standardErrors() },
      },
    )
    .get(
      '/wordle/leaderboard',
      async (ctx) => {
        await limit(ctx, RATE_LIMITS.public)

        return await wordle.getLeaderboard()
      },
      {
        response: { 200: 'WordleLeaderboardDTO' as const, ...publicErrors() },
      },
    )
    .get(
      '/wordle/practice',
      async (ctx) => {
        await limit(ctx, RATE_LIMITS.public)

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
        await limit(ctx, RATE_LIMITS.wordlePractice)

        return await wordle.startPractice((await requirePlayer(ctx.request)).id)
      },
      {
        response: { 200: 'WordlePracticeStateDTO' as const, ...standardErrors() },
      },
    )
    .post(
      '/wordle/practice/guess',
      async (ctx) => {
        await limit(ctx, RATE_LIMITS.wordlePractice)

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
        await limit(ctx, RATE_LIMITS.public)

        return await wordleNotifications.getStatus((await requirePlayer(ctx.request)).id)
      },
      {
        response: { 200: 'WordleNotificationsStatusDTO' as const, ...standardErrors() },
      },
    )
    .patch(
      '/wordle/notifications',
      async (ctx) => {
        await limit(ctx, RATE_LIMITS.public)

        return await wordleNotifications.updateFlags(
          (await requirePlayer(ctx.request)).id,
          ctx.body as WordleNotificationUpdate,
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
        await limit(ctx, RATE_LIMITS.write)
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
        await limit(ctx, RATE_LIMITS.public)
        const user = await requirePlayer(ctx.request)

        await wordleNotifications.disconnect(user.id)

        return { ok: true }
      },
      {
        response: { 200: 'WordleNotificationsDeleteDTO' as const, ...standardErrors() },
      },
    )
}
