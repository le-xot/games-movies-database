import { Global, Module } from '@nestjs/common'
import { RateLimitModule } from '@/modules/rate-limit/rate-limit.module'
import { TelegramAuthStore } from './telegram-auth.store'
import { TelegramService } from './telegram.service'

@Global()
@Module({
  imports: [RateLimitModule],
  providers: [TelegramAuthStore, TelegramService],
  exports: [TelegramService],
})
export class TelegramModule {}
