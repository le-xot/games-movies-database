import { Module } from '@nestjs/common'
import { PrismaModule } from 'src/database/prisma.module'
import { TwitchModule } from '../twitch/twitch.module'
import { RecordsProvidersService } from './records-providers.service'

@Module({
  imports: [PrismaModule, TwitchModule],
  providers: [RecordsProvidersService],
  exports: [RecordsProvidersService],
},
)
export class RecordsProvidersModule {}
