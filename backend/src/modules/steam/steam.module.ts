import { Module } from '@nestjs/common'
import { PrismaModule } from '@/database/prisma.module'
import { RecordModule } from '@/modules/record/record.module'
import { RecordsProvidersModule } from '@/modules/records-providers/records-providers.module'
import { SteamController } from './steam.controller'
import { SteamService } from './steam.service'

@Module({
  imports: [PrismaModule, RecordsProvidersModule, RecordModule],
  providers: [SteamService],
  controllers: [SteamController],
})
export class SteamModule {}
