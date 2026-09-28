import { Module } from '@nestjs/common'
import { RedisClient } from 'bun'
import { DrizzleModule } from '@/database/drizzle.module'
import { RateLimitModule } from '@/modules/rate-limit/rate-limit.module'
import { TelegramBotService } from '@/modules/telegram/telegram-bot.service'
import { TelegramCommandRegistry } from '@/modules/telegram/telegram-command.registry'
import { UserModule } from '@/modules/user/user.module'
import { UserService } from '@/modules/user/user.service'
import { DrizzleWordleNotificationRepository } from '@/modules/wordle/repositories/drizzle-wordle-notification.repository'
import { DrizzleWordleRepository } from '@/modules/wordle/repositories/drizzle-wordle.repository'
import { WordleLeaderboardCache } from '@/modules/wordle/wordle-leaderboard.cache'
import { WordleNotificationController } from '@/modules/wordle/wordle-notification.controller'
import { WordleNotificationService } from '@/modules/wordle/wordle-notification.service'
import { WordleController } from '@/modules/wordle/wordle.controller'
import { WordleDictionary } from '@/modules/wordle/wordle.dictionary'
import { WordleService } from '@/modules/wordle/wordle.service'
import { env } from '@/utils/enviroments'

@Module({
  imports: [DrizzleModule, UserModule, RateLimitModule],
  controllers: [WordleController, WordleNotificationController],
  providers: [
    WordleService,
    DrizzleWordleRepository,
    DrizzleWordleNotificationRepository,
    {
      provide: WordleNotificationService,
      useFactory: (
        telegram: TelegramBotService,
        registry: TelegramCommandRegistry,
        notifications: DrizzleWordleNotificationRepository,
        users: UserService,
        redis: RedisClient,
      ) =>
        new WordleNotificationService(telegram, registry, notifications, users, redis, {
          appPublicUrl: env.APP_PUBLIC_URL,
          morningRaw: env.WORDLE_NOTIFY_MORNING,
          eveningRaw: env.WORDLE_NOTIFY_EVENING,
        }),
      inject: [
        TelegramBotService,
        TelegramCommandRegistry,
        DrizzleWordleNotificationRepository,
        UserService,
        RedisClient,
      ],
    },
    {
      provide: WordleLeaderboardCache,
      useFactory: () => new WordleLeaderboardCache(),
    },
    {
      provide: WordleDictionary,
      useFactory: () => new WordleDictionary(env.WORDLE_ANSWERS_SALT),
    },
  ],
})
export class WordleModule {}
