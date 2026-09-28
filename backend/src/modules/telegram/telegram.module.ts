import { Global, Module } from '@nestjs/common'
import { env } from '@/utils/enviroments'
import { TelegramBotController } from './telegram-bot.controller'
import { TelegramBotService } from './telegram-bot.service'
import { TelegramCommandRegistry } from './telegram-command.registry'
import { TelegramService } from './telegram.service'

@Global()
@Module({
  controllers: [TelegramBotController],
  providers: [
    TelegramService,
    {
      provide: TelegramBotService,
      useFactory: () =>
        new TelegramBotService({
          token: env.TELEGRAM_BOT_TOKEN ?? null,
          webhookUrl: env.TELEGRAM_BOT_WEBHOOK_URL ?? null,
          webhookSecret: env.TELEGRAM_BOT_WEBHOOK_SECRET ?? null,
        }),
    },
    {
      provide: TelegramCommandRegistry,
      useFactory: (bot: TelegramBotService) => new TelegramCommandRegistry(bot),
      inject: [TelegramBotService],
    },
  ],
  exports: [TelegramService, TelegramBotService, TelegramCommandRegistry],
})
export class TelegramModule {}
