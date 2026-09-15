import { Module } from '@nestjs/common'
import { DrizzleModule } from '@/database/drizzle.module'
import { TwitchModule } from '@/modules/twitch/twitch.module'
import { RecordsProvidersService } from './records-providers.service'
import { DrizzleRecordsProvidersRepository } from './repositories/drizzle-records-providers.repository'

@Module({
  imports: [DrizzleModule, TwitchModule],
  providers: [RecordsProvidersService, DrizzleRecordsProvidersRepository],
  exports: [RecordsProvidersService],
})
export class RecordsProvidersModule {}
