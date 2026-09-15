import { Module } from '@nestjs/common'
import { DrizzleModule } from '@/database/drizzle.module'
import { TwitchModule } from '@/modules/twitch/twitch.module'
import { RecordsProvidersService } from './records-providers.service'
import { DrizzleRecordsProvidersRepository } from './repositories/drizzle-records-providers.repository'
import { RecordsProvidersRepository } from './repositories/records-providers.repository'

@Module({
  imports: [DrizzleModule, TwitchModule],
  providers: [
    RecordsProvidersService,
    { provide: RecordsProvidersRepository, useClass: DrizzleRecordsProvidersRepository },
  ],
  exports: [RecordsProvidersService],
})
export class RecordsProvidersModule {}
