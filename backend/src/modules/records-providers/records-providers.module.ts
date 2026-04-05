import { Module } from '@nestjs/common'
import { PrismaModule } from '@/database/prisma.module'
import { TwitchModule } from '@/modules/twitch/twitch.module'
import { PrismaRecordsProvidersRepository } from './repositories/prisma-records-providers.repository'
import { RecordsProvidersRepository } from './repositories/records-providers.repository'
import { RecordsProvidersService } from './records-providers.service'

@Module({
  imports: [PrismaModule, TwitchModule],
  providers: [
    RecordsProvidersService,
    { provide: RecordsProvidersRepository, useClass: PrismaRecordsProvidersRepository },
  ],
  exports: [RecordsProvidersService],
})
export class RecordsProvidersModule {}
