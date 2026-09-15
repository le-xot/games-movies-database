import { Module } from '@nestjs/common'
import { RecordModule } from '@/modules/record/record.module'
import { RecordsProvidersModule } from '@/modules/records-providers/records-providers.module'
import { UserModule } from '@/modules/user/user.module'
import { SteamController } from './steam.controller'
import { SteamService } from './steam.service'

@Module({
  imports: [RecordsProvidersModule, RecordModule, UserModule],
  providers: [SteamService],
  controllers: [SteamController],
})
export class SteamModule {}
