import { DrizzleService } from '@backend/database/drizzle.service'
import { createJwtAuthenticator } from '@backend/gateway/jwt-authenticator'
import { AuthService } from '@backend/modules/auth/auth.service'
import { AvatarService } from '@backend/modules/avatar/avatar.service'
import { CocktailBotService } from '@backend/modules/cocktail/cocktail-bot.service'
import { CocktailService } from '@backend/modules/cocktail/cocktail.service'
import { DrizzleCocktailRepository } from '@backend/modules/cocktail/repositories/drizzle-cocktail.repository'
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
import { TelegramService } from '@backend/modules/telegram/telegram.service'
import { TwirService } from '@backend/modules/twir/twir.service'
import { TwitchService } from '@backend/modules/twitch/twitch.service'
import { DrizzleCustomizationStatsRepository } from '@backend/modules/user/repositories/drizzle-customization-stats.repository'
import { DrizzleUserRepository } from '@backend/modules/user/repositories/drizzle-user.repository'
import { UserService } from '@backend/modules/user/user.service'
import { WeatherService } from '@backend/modules/weather/weather.service'
import { DrizzleWordleNotificationRepository } from '@backend/modules/wordle/repositories/drizzle-wordle-notification.repository'
import { DrizzleWordleRepository } from '@backend/modules/wordle/repositories/drizzle-wordle.repository'
import { WordleLeaderboardCache } from '@backend/modules/wordle/wordle-leaderboard.cache'
import { WordleMiniAppService } from '@backend/modules/wordle/wordle-miniapp.service'
import { WordleNotificationService } from '@backend/modules/wordle/wordle-notification.service'
import { WordlePracticeService } from '@backend/modules/wordle/wordle-practice.service'
import { WordleDictionary } from '@backend/modules/wordle/wordle.dictionary'
import { WordleService } from '@backend/modules/wordle/wordle.service'
import { Lifecycle } from '@backend/server/lifecycle'
import { analyticsPorts } from '@backend/server/wiring/analytics'
import { catalogPorts } from '@backend/server/wiring/catalog'
import { cocktailPorts } from '@backend/server/wiring/cocktails'
import { integrationPorts } from '@backend/server/wiring/integrations'
import { peoplePorts } from '@backend/server/wiring/people'
import { wordlePorts } from '@backend/server/wiring/wordle'
import { DomainEvents } from '@backend/utils/domain-events'
import { env } from '@backend/utils/enviroments'
import { Logger } from '@backend/utils/logger'
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
 * Composition root: здесь и только здесь собираются сервисы и порты гейтвея.
 *
 * Сервисы — обычные классы без DI; зависимости передаются в конструктор.
 * Порты по доменам собирают `server/wiring/*`: они приводят форму запроса
 * (query/body) к аргументам сервиса, данные при этом идут как есть — сущности
 * уже отдают ISO-строки для дат.
 */
export function createContainer(): Container {
  const lifecycle = new Lifecycle((message) => new Logger('Lifecycle').warn(message))
  const drizzle = lifecycle.add(new DrizzleService(env.DATASOURCE_URL))
  const events = new DomainEvents()
  const s3 = lifecycle.add(new S3Service())

  const avatars = lifecycle.add(new AvatarService(s3))
  const users = lifecycle.add(
    new UserService(
      new DrizzleUserRepository(drizzle),
      events,
      avatars,
      new DrizzleCustomizationStatsRepository(drizzle),
    ),
  )
  const likes = lifecycle.add(new LikeService(new DrizzleLikeRepository(drizzle), events))
  const stats = lifecycle.add(new StatsService(new DrizzleStatsRepository(drizzle)))
  const queue = lifecycle.add(new QueueService(new DrizzleQueueRepository(drizzle)))
  const weather = lifecycle.add(new WeatherService())

  const ratingRepository = lifecycle.add(new DrizzleRatingRepository(drizzle))
  const ratings = lifecycle.add(new RatingService(ratingRepository, drizzle, events))

  const twitch = lifecycle.add(new TwitchService())
  const providers = lifecycle.add(
    new RecordsProvidersService(new DrizzleRecordsProvidersRepository(drizzle), twitch),
  )
  const recordRepository = lifecycle.add(new DrizzleRecordRepository(drizzle))
  const imgService = lifecycle.add(new ImgService(s3))
  const records = lifecycle.add(
    new RecordService(recordRepository, providers, events, imgService, ratingRepository),
  )
  const suggestions = lifecycle.add(
    new SuggestionService(
      new DrizzleSuggestionRepository(drizzle, recordRepository),
      providers,
      events,
    ),
  )
  const limits = lifecycle.add(new LimitService(new DrizzleLimitRepository(drizzle)))
  const steam = lifecycle.add(new SteamService(providers, recordRepository, events))
  const twir = lifecycle.add(new TwirService(users, suggestions))
  const cocktails = lifecycle.add(new CocktailService(new DrizzleCocktailRepository(drizzle)))

  const redisClient = new RedisClient(env.REDIS_URL)

  const dictionary = new WordleDictionary(env.WORDLE_ANSWERS_SALT)
  const wordle = lifecycle.add(
    new WordleService(
      new DrizzleWordleRepository(drizzle),
      dictionary,
      new WordleLeaderboardCache(),
      events,
    ),
  )
  const wordlePractice = lifecycle.add(new WordlePracticeService(redisClient, dictionary))
  const telegramService = lifecycle.add(new TelegramService())
  const kick = lifecycle.add(new KickService())
  const authService = lifecycle.add(new AuthService(env.JWT_SECRET, users, twitch, kick))
  const telegramBot = lifecycle.add(
    new TelegramBotService({
      // Пустая строка из `.env.example` — это «не задано»: grammY не создаёт Bot
      // с пустым токеном, а падать на старте из-за этого приложение не должно.
      token: env.TELEGRAM_BOT_TOKEN || null,
      webhookUrl: env.TELEGRAM_BOT_WEBHOOK_URL || null,
      webhookSecret: env.TELEGRAM_BOT_WEBHOOK_SECRET || null,
    }),
  )
  // Хуков инициализации нет: команда регистрируется в конструкторе. Экземпляр
  // всё равно регистрируем, чтобы будущий хук заработал сам, а `void` гасит
  // «неиспользуемую переменную».
  void lifecycle.add(
    new CocktailBotService(telegramBot, cocktails, users, { appPublicUrl: env.APP_PUBLIC_URL }),
  )
  // В конструкторе регистрирует /wordle, в bootstrap ставит кнопку меню рядом
  // с полем ввода. Создаётся раньше уведомлений, чтобы игра стояла выше них
  // в меню команд.
  void lifecycle.add(
    new WordleMiniAppService(telegramBot, users, wordle, { appPublicUrl: env.APP_PUBLIC_URL }),
  )
  const wordleNotifications = lifecycle.add(
    new WordleNotificationService(
      telegramBot,
      new DrizzleWordleNotificationRepository(drizzle),
      users,
      redisClient,
      {
        appPublicUrl: env.APP_PUBLIC_URL,
        morningRaw: env.WORDLE_NOTIFY_MORNING,
        eveningRaw: env.WORDLE_NOTIFY_EVENING,
      },
    ),
  )

  // При падении Redis срабатывает каждый запрос: без троттлинга это тысячи
  // одинаковых строк в минуту.
  let lastRateLimitWarning = 0
  const RATE_LIMIT_WARNING_INTERVAL_MS = 10_000

  const rateLimit: RateLimiter = {
    hit: (key, config) =>
      hitRateLimit(redisClient, key, config, (error) => {
        const now = Date.now()
        if (now - lastRateLimitWarning < RATE_LIMIT_WARNING_INTERVAL_MS) return

        lastRateLimitWarning = now
        new Logger('RateLimit').warn(`Redis недоступен, лимит пропущен: ${String(error)}`)
      }),
  }

  const auth = createJwtAuthenticator({
    secret: env.JWT_SECRET,
    users: { getById: (id) => users.getUserById(id) },
  })

  return {
    emitter: events,
    async init() {
      await lifecycle.init()
    },
    deps: {
      ...analyticsPorts({ weather, stats, queue }),
      ...catalogPorts({ records, ratings, likes, suggestions }),
      ...peoplePorts({ users, auth }),
      ...integrationPorts({
        limits,
        twir,
        twirApiKey: env.TWIR_API,
        images: imgService,
        avatars,
        steam,
        auth: authService,
        telegram: telegramService,
        telegramBot,
      }),
      ...wordlePorts({ wordle, wordlePractice, wordleNotifications }),
      ...cocktailPorts({ cocktails }),
      rateLimit,
    },
    async close() {
      await lifecycle.close()
      redisClient.close()
    },
  }
}
