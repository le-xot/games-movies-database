import { DrizzleService } from '@backend/database/drizzle.service'
import { createJwtAuthenticator } from '@backend/gateway/jwt-authenticator'
import { AuthService } from '@backend/modules/auth/auth.service'
import { AvatarService } from '@backend/modules/avatar/avatar.service'
import { ImgVariant } from '@backend/modules/img/img.dto'
import { ImgService } from '@backend/modules/img/img.service'
import { KickService } from '@backend/modules/kick/kick.service'
import { LikeService } from '@backend/modules/like/like.service'
import { DrizzleLikeRepository } from '@backend/modules/like/repositories/drizzle-like.repository'
import { LimitService } from '@backend/modules/limit/limit.service'
import { DrizzleLimitRepository } from '@backend/modules/limit/repositories/drizzle-limit.repository'
import { QueueService } from '@backend/modules/queue/queue.service'
import { DrizzleQueueRepository } from '@backend/modules/queue/repositories/drizzle-queue.repository'
import { RatingService } from '@backend/modules/rating/rating.service'
import { DrizzleRatingRepository } from '@backend/modules/rating/repositories/drizzle-rating.repository'
import { RecordService } from '@backend/modules/record/record.service'
import { DrizzleRecordRepository } from '@backend/modules/record/repositories/drizzle-record.repository'
import { RecordsProvidersService } from '@backend/modules/records-providers/records-providers.service'
import { DrizzleRecordsProvidersRepository } from '@backend/modules/records-providers/repositories/drizzle-records-providers.repository'
import { S3Service } from '@backend/modules/s3/s3.service'
import { DrizzleStatsRepository } from '@backend/modules/stats/repositories/drizzle-stats.repository'
import { StatsService } from '@backend/modules/stats/stats.service'
import { SteamService } from '@backend/modules/steam/steam.service'
import { DrizzleSuggestionRepository } from '@backend/modules/suggestion/repositories/drizzle-suggestion.repository'
import { SuggestionService } from '@backend/modules/suggestion/suggestion.service'
import { TelegramBotService } from '@backend/modules/telegram/telegram-bot.service'
import { TelegramCommandRegistry } from '@backend/modules/telegram/telegram-command.registry'
import { TelegramService } from '@backend/modules/telegram/telegram.service'
import { TwirService } from '@backend/modules/twir/twir.service'
import { TwitchService } from '@backend/modules/twitch/twitch.service'
import { DrizzleUserRepository } from '@backend/modules/user/repositories/drizzle-user.repository'
import { UserService } from '@backend/modules/user/user.service'
import { WeatherService } from '@backend/modules/weather/weather.service'
import { DrizzleWordleNotificationRepository } from '@backend/modules/wordle/repositories/drizzle-wordle-notification.repository'
import { DrizzleWordleRepository } from '@backend/modules/wordle/repositories/drizzle-wordle.repository'
import { WordleLeaderboardCache } from '@backend/modules/wordle/wordle-leaderboard.cache'
import { WordleNotificationService } from '@backend/modules/wordle/wordle-notification.service'
import { WordlePracticeService } from '@backend/modules/wordle/wordle-practice.service'
import { WordleDictionary } from '@backend/modules/wordle/wordle.dictionary'
import { WordleService } from '@backend/modules/wordle/wordle.service'
import {
  toGatewayAccount,
  toGatewayLike,
  toGatewayRatedRecord,
  toGatewayRating,
  toGatewayRecord,
  toGatewayUser,
} from '@backend/server/adapters'
import { DomainEvents } from '@backend/utils/domain-events'
import { env } from '@backend/utils/enviroments'
import { hitRateLimit } from '@backend/utils/rate-limit'
import { RedisClient } from 'bun'
import type { GatewayDeps } from '@backend/gateway'
import type { RateLimiter } from '@backend/gateway/rate-limit'

export interface Container {
  deps: GatewayDeps
  /** Доменная шина: через неё же идут события в WebSocket. */
  emitter: DomainEvents
  /**
   * Запускает хуки инициализации сервисов. Раньше это делал Nest; теперь
   * composition root вызывает их сам, иначе прогрев погоды, расписание
   * уведомлений и таймер уборки просто не стартуют.
   */
  init(): Promise<void>
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
  const events = new DomainEvents()
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
  const authService = new AuthService(env.JWT_SECRET, users, twitch, kick)
  const telegramBot = new TelegramBotService({
    token: env.TELEGRAM_BOT_TOKEN ?? null,
    webhookUrl: env.TELEGRAM_BOT_WEBHOOK_URL ?? null,
    webhookSecret: env.TELEGRAM_BOT_WEBHOOK_SECRET ?? null,
  })
  const telegramCommands = new TelegramCommandRegistry(telegramBot)
  const wordleNotifications = new WordleNotificationService(
    telegramBot,
    telegramCommands,
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

  const started: Array<{
    onModuleInit?: () => unknown
    onApplicationBootstrap?: () => unknown
  }> = [twitch, kick, telegramBot, telegramCommands, weather, wordle, wordleNotifications]

  const stoppable: Array<{ onModuleDestroy?: () => unknown }> = [wordle, wordleNotifications]

  return {
    emitter: events,
    async init() {
      for (const service of started) {
        try {
          await service.onModuleInit?.()
          await service.onApplicationBootstrap?.()
        } catch (error) {
          // Nest ронял старт приложения; здесь живём дальше: погода или
          // телеграм могут быть недоступны, но сайт обязан подняться.
          console.warn(`[gateway] init ${service.constructor.name} упал: ${String(error)}`)
        }
      }
    },
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
        getLikesByRecordId: async (recordId) => {
          const page = await likes.getLikesByRecordId(recordId)

          return { likes: page.likes.map(toGatewayLike), total: page.total }
        },
        getLikesByUserId: async (userId) => {
          const page = await likes.getLikesByUserId(userId)

          return { likes: page.likes.map(toGatewayLike), total: page.total }
        },
        getLikes: async (page, limit) => {
          const result = await likes.getLikes(page, limit)

          return { likes: result.likes.map(toGatewayLike), total: result.total }
        },
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
      for (const service of stoppable) {
        try {
          await service.onModuleDestroy?.()
        } catch (error) {
          console.warn(`[gateway] shutdown ${service.constructor.name} упал: ${String(error)}`)
        }
      }

      await drizzle.pool.end()
      redisClient.close()
    },
  }
}
