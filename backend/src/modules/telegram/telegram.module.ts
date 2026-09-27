import { Global, Module } from '@nestjs/common'
import { env } from '@/utils/enviroments'
import { TelegramBotController } from './telegram-bot.controller'
import { TelegramBotService } from './telegram-bot.service'
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
          token: env.TELEGRAM_BOT_TOKEN,
          webhookUrl: env.TELEGRAM_BOT_WEBHOOK_URL,
          webhookSecret: env.TELEGRAM_BOT_WEBHOOK_SECRET,
        }),
    },
  ],
  exports: [TelegramService, TelegramBotService],
})
export class TelegramModule {}
