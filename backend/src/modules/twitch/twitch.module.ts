import { Global, Module } from '@nestjs/common'
import { TwitchService } from '@/modules/twitch/twitch.service'

@Global()
@Module({
  providers: [TwitchService],
  exports: [TwitchService],
})
export class TwitchModule {}
