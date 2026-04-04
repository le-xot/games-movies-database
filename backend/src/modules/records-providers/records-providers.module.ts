import { Module } from '@nestjs/common'
import { PrismaModule } from '@/database/prisma.module'
import { RecordsProvidersService } from '@/modules/records-providers/records-providers.service'
import { TwitchModule } from '@/modules/twitch/twitch.module'

@Module({
  imports: [PrismaModule, TwitchModule],
  providers: [RecordsProvidersService],
  exports: [RecordsProvidersService],
})
export class RecordsProvidersModule {}
