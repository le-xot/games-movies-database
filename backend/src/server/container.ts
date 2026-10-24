import { EventEmitter2 } from '@nestjs/event-emitter'
import { JwtService } from '@nestjs/jwt'
import { RedisClient } from 'bun'
import { DrizzleService } from '@/database/drizzle.service'
import { createJwtAuthenticator } from '@/gateway/jwt-authenticator'
import { AuthService } from '@/modules/auth/auth.service'
import { AvatarService } from '@/modules/avatar/avatar.service'
import { ImgVariant } from '@/modules/img/img.dto'
import { ImgService } from '@/modules/img/img.service'
import { KickService } from '@/modules/kick/kick.service'
import { LikeService } from '@/modules/like/like.service'
import { DrizzleLikeRepository } from '@/modules/like/repositories/drizzle-like.repository'
import { LimitService } from '@/modules/limit/limit.service'
import { DrizzleLimitRepository } from '@/modules/limit/repositories/drizzle-limit.repository'
import { QueueService } from '@/modules/queue/queue.service'
import { DrizzleQueueRepository } from '@/modules/queue/repositories/drizzle-queue.repository'
import { RatingService } from '@/modules/rating/rating.service'
import { DrizzleRatingRepository } from '@/modules/rating/repositories/drizzle-rating.repository'
import { RecordService } from '@/modules/record/record.service'
import { DrizzleRecordRepository } from '@/modules/record/repositories/drizzle-record.repository'
import { RecordsProvidersService } from '@/modules/records-providers/records-providers.service'
import { DrizzleRecordsProvidersRepository } from '@/modules/records-providers/repositories/drizzle-records-providers.repository'
import { S3Service } from '@/modules/s3/s3.service'
import { DrizzleStatsRepository } from '@/modules/stats/repositories/drizzle-stats.repository'
import { StatsService } from '@/modules/stats/stats.service'
import { SteamService } from '@/modules/steam/steam.service'
import { DrizzleSuggestionRepository } from '@/modules/suggestion/repositories/drizzle-suggestion.repository'
import { SuggestionService } from '@/modules/suggestion/suggestion.service'
import { TelegramBotService } from '@/modules/telegram/telegram-bot.service'
import { TelegramCommandRegistry } from '@/modules/telegram/telegram-command.registry'
import { TelegramService } from '@/modules/telegram/telegram.service'
import { TwirService } from '@/modules/twir/twir.service'
import { TwitchService } from '@/modules/twitch/twitch.service'
import { DrizzleUserRepository } from '@/modules/user/repositories/drizzle-user.repository'
import { UserService } from '@/modules/user/user.service'
import { WeatherService } from '@/modules/weather/weather.service'
import { DrizzleWordleNotificationRepository } from '@/modules/wordle/repositories/drizzle-wordle-notification.repository'
import { DrizzleWordleRepository } from '@/modules/wordle/repositories/drizzle-wordle.repository'
import { WordleLeaderboardCache } from '@/modules/wordle/wordle-leaderboard.cache'
import { WordleNotificationService } from '@/modules/wordle/wordle-notification.service'
import { WordlePracticeService } from '@/modules/wordle/wordle-practice.service'
import { WordleDictionary } from '@/modules/wordle/wordle.dictionary'
import { WordleService } from '@/modules/wordle/wordle.service'
import {
  toGatewayAccount,
  toGatewayLike,
  toGatewayRatedRecord,
  toGatewayRating,
  toGatewayRecord,
  toGatewayUser,
} from '@/server/adapters'
import { env } from '@/utils/enviroments'
import { hitRateLimit } from '@/utils/rate-limit'
import type { GatewayDeps } from '@/gateway'
import type { RateLimiter } from '@/gateway/rate-limit'

export interface Container {
  deps: GatewayDeps
  close(): Promise<void>
}

/**
 * Composition root гейтвея: зависимости собираются руками, явно и в одном месте.
 *
 * Доменные сервисы пока помечены `@Injectable()` и пользуются Nest-логгером, но
 * это обычные классы — DI им не нужен, декораторы не мешают `new`. Поэтому
 * гейтвей может подняться, пока Nest ещё жив.
 */
export function createContainer(): Container {
  const drizzle = new DrizzleService()
  const events = new EventEmitter2()
  const s3 = new S3Service()

  const avatars = new AvatarService(s3)
  const users = new UserService(new DrizzleUserRepository(drizzle), events, avatars)
  const likes = new LikeService(new DrizzleLikeRepository(drizzle), events)
  const stats = new StatsService(new DrizzleStatsRepository(drizzle))
  const queue = new QueueService(new DrizzleQueueRepository(drizzle))
  const weather = new WeatherService()

  const ratingRepository = new DrizzleRatingRepository(drizzle)
  const ratings = new RatingService(ratingRepository, drizzle, events)

  const twitch = new TwitchService()
  const providers = new RecordsProvidersService(
    new DrizzleRecordsProvidersRepository(drizzle),
    twitch,
  )
  const records = new RecordService(
    new DrizzleRecordRepository(drizzle),
    providers,
    events,
    new ImgService(s3),
    ratingRepository,
  )
  const suggestions = new SuggestionService(
    new DrizzleSuggestionRepository(drizzle),
    providers,
    events,
  )
  const limits = new LimitService(new DrizzleLimitRepository(drizzle))
  const imgService = new ImgService(s3)
  const steam = new SteamService(providers, new DrizzleRecordRepository(drizzle), events)
  const twir = new TwirService(users, suggestions)

  const redisClient = new RedisClient(env.REDIS_URL)

  const dictionary = new WordleDictionary(env.WORDLE_ANSWERS_SALT)
  const wordle = new WordleService(
    new DrizzleWordleRepository(drizzle),
    dictionary,
    new WordleLeaderboardCache(),
    events,
  )
  const wordlePractice = new WordlePracticeService(redisClient, dictionary)
  const telegramService = new TelegramService()
  const kick = new KickService()
  const authService = new AuthService(
    new JwtService({ secret: env.JWT_SECRET, signOptions: { expiresIn: '30d' } }),
    users,
    twitch,
    kick,
  )
  const telegramBot = new TelegramBotService({
    token: env.TELEGRAM_BOT_TOKEN ?? null,
    webhookUrl: env.TELEGRAM_BOT_WEBHOOK_URL ?? null,
    webhookSecret: env.TELEGRAM_BOT_WEBHOOK_SECRET ?? null,
  })
  const wordleNotifications = new WordleNotificationService(
    telegramBot,
    new TelegramCommandRegistry(telegramBot),
    new DrizzleWordleNotificationRepository(drizzle),
    users,
    redisClient,
    {
      appPublicUrl: env.APP_PUBLIC_URL,
      morningRaw: env.WORDLE_NOTIFY_MORNING,
      eveningRaw: env.WORDLE_NOTIFY_EVENING,
    },
  )

  const rateLimit: RateLimiter = {
    hit: (key, config) =>
      hitRateLimit(redisClient, key, config, (error) => {
        console.warn(`[gateway] Redis недоступен, лимит пропущен: ${String(error)}`)
      }),
  }

  return {
    deps: {
      weather,
      stats,
      queue,
      records: {
        createFromLink: async (data) =>
          toGatewayRecord(
            await records.createRecordFromLink({
              link: data.link,
              ...(data.status ? { status: data.status } : {}),
              ...(data.type ? { type: data.type } : {}),
            }),
          ),
        findById: async (id, viewerId) =>
          toGatewayRecord(await records.findRecordById(id, viewerId)),
        patch: async (id, data) =>
          toGatewayRecord(
            await records.patchRecord(id, {
              ...(data.status ? { status: data.status } : {}),
              ...(data.grade !== undefined ? { grade: data.grade } : {}),
              ...(data.episode !== undefined ? { episode: data.episode } : {}),
              ...(data.type ? { type: data.type } : {}),
            }),
          ),
        updatePoster: async (id, url) => toGatewayRecord(await records.updatePoster(id, url)),
        remove: (id) => records.deleteRecord(id),
        getAll: async (query) => {
          const { page, limit, orderBy, direction, viewerId, ...rest } = query
          const filters = {
            ...(rest.search !== undefined ? { search: rest.search } : {}),
            ...(rest.status !== undefined ? { status: rest.status } : {}),
            ...(rest.type !== undefined ? { type: rest.type } : {}),
            ...(rest.grade !== undefined ? { grade: rest.grade } : {}),
            ...(rest.genre !== undefined ? { genre: rest.genre } : {}),
          }

          const result = await records.getAllRecords(
            page,
            limit,
            filters,
            orderBy,
            direction,
            viewerId,
          )

          return { records: result.records.map(toGatewayRecord), total: result.total }
        },
      },
      ratings: {
        rate: async (userId, recordId, grade) =>
          toGatewayRating(await ratings.rate(userId, recordId, grade)),
        unrate: (userId, recordId) => ratings.unrate(userId, recordId),
        getMy: async (userId, query) => {
          const { items, total } = await ratings.getUserRatings(
            userId,
            userId,
            query.page,
            query.limit,
            query.grade,
          )

          return { items: items.map(toGatewayRatedRecord), total }
        },
        getUser: async (viewerId, userId, query) => {
          const { items, total } = await ratings.getUserRatings(
            viewerId,
            userId,
            query.page,
            query.limit,
            query.grade,
          )

          return { items: items.map(toGatewayRatedRecord), total }
        },
        getFriends: async () => ({ members: await ratings.getFriends() }),
      },
      likes: {
        createLike: async (userId, recordId) =>
          toGatewayLike(await likes.createLike(userId, recordId)),
        deleteLike: (userId, recordId) => likes.deleteLike(userId, recordId),
        getLikesByRecordId: (recordId) => likes.getLikesByRecordId(recordId),
        getLikesByUserId: (userId) => likes.getLikesByUserId(userId),
        getLikes: (page, limit) => likes.getLikes(page, limit),
      },
      users: {
        getAll: async () => (await users.getAllUsers()).map(toGatewayUser),
        getById: async (id) => {
          const user = await users.getUserById(id)

          return user ? toGatewayUser(user) : null
        },
        getAccounts: async (id) => (await users.getLinkedAccounts(id)).map(toGatewayAccount),
        remove: (id) => users.deleteUserById(id),
        merge: (targetId, sourceUserId) => users.mergeUsers(targetId, sourceUserId),
      },
      suggestions: {
        list: async () => (await suggestions.getSuggestions()).map(toGatewayRecord),
        create: (input) => suggestions.userSuggest(input),
        remove: (id, userId) => suggestions.deleteUserSuggestion(id, userId),
      },
      limits: {
        change: (input) => limits.changeLimit(input),
      },
      twir: {
        createSuggestion: (input) => twir.createSuggestionWithTwir(input),
      },
      twirApiKey: env.TWIR_API,
      images: {
        getImage: (urlEncoded, variant) =>
          imgService.getImageContent(
            urlEncoded,
            variant === 'avatar' ? ImgVariant.AVATAR : ImgVariant.POSTER,
          ),
      },
      avatars: {
        getAvatar: (userId) => avatars.getAvatarBuffer(userId),
      },
      steam: {
        getGames: async () => {
          const [games, existing] = await Promise.all([
            steam.getOwnedGames(),
            steam.findDuplicateGames(),
          ])

          return {
            games,
            existingAppIds: games
              .filter((game) => steam.isDuplicate(game, existing))
              .map((game) => String(game.appid)),
          }
        },
        importGames: async (games, userId) => {
          const result = await steam.importGames(
            games.map((game) => ({
              appId: game.appId,
              status: game.status,
              ...(game.grade !== undefined && game.grade !== null ? { grade: game.grade } : {}),
            })),
            userId,
          )

          return { ...result, created: result.created.map(toGatewayRecord) }
        },
      },
      oauth: {
        exchangeTwitch: (code) => authService.handleTwitchCallback(code),
        exchangeKick: (code, verifier) => authService.handleKickCallback(code, verifier),
        linkTwitch: async (userId, code) => {
          await authService.linkTwitchAccount(userId, code)
        },
        linkKick: async (userId, code, verifier) => {
          await authService.linkKickAccount(userId, code, verifier)
        },
        createTelegramRequest: () => telegramService.createAuthorizationRequest(),
        exchangeTelegram: (code, verifier) => telegramService.exchangeCode(code, verifier),
        loginTelegram: (profile) => authService.handleTelegramOidcLogin(profile as never),
        linkTelegram: async (userId, profile) => {
          await authService.linkTelegramOidc(userId, profile as never)
        },
      },
      oauthConfig: {
        twitchClientId: env.TWITCH_CLIENT_ID ?? '',
        twitchCallbackUrl: env.TWITCH_CALLBACK_URL,
        kickClientId: env.KICK_CLIENT_ID ?? '',
        kickCallbackUrl: env.KICK_CALLBACK_URL ?? '',
        telegramCallbackUrl: env.TELEGRAM_CALLBACK_URL,
        production: env.NODE_ENV === 'production',
      },
      authSession: {
        getAccounts: async (userId) =>
          (await users.getLinkedAccounts(userId)).map(toGatewayAccount),
        unlinkAccount: (userId, platform) => users.unlinkPlatformAccount(userId, platform),
        updateLogin: async (userId, login) => toGatewayUser(await users.updateLogin(userId, login)),
        deleteUser: (userId) => users.deleteUserById(userId),
        uploadAvatar: async (userId, buffer) =>
          toGatewayUser(await users.uploadAvatar(userId, buffer)),
        deleteAvatar: async (userId) => toGatewayUser(await users.deleteAvatar(userId)),
      },
      wordle: {
        getState: (userId) => wordle.getState(userId),
        makeGuess: (userId, word) => wordle.makeGuess(userId, word),
        getStats: (userId) => wordle.getStats(userId),
        getLeaderboard: () => wordle.getLeaderboard(),
        getPracticeState: (userId) => wordlePractice.getState(userId),
        startPractice: (userId) => wordlePractice.start(userId),
        makePracticeGuess: (userId, word) => wordlePractice.makeGuess(userId, word),
      },
      wordleNotifications: {
        getStatus: (userId) => wordleNotifications.getStatus(userId),
        updateFlags: (userId, input) =>
          wordleNotifications.updateFlags(userId, {
            ...(input.morningEnabled !== undefined ? { morningEnabled: input.morningEnabled } : {}),
            ...(input.eveningEnabled !== undefined ? { eveningEnabled: input.eveningEnabled } : {}),
          }),
        createLink: (userId) => wordleNotifications.createLink(userId),
        disconnect: (userId) => wordleNotifications.disconnect(userId),
      },
      auth: createJwtAuthenticator({
        secret: env.JWT_SECRET,
        users: {
          getById: async (id) => {
            const user = await users.getUserById(id)

            return user ? toGatewayUser(user) : null
          },
        },
      }),
      rateLimit,
    },
    async close() {
      await drizzle.pool.end()
      redisClient.close()
    },
  }
}
