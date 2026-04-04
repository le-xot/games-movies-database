import { Module } from '@nestjs/common'
import { PrismaModule } from '@/database/prisma.module'
import { RecordController } from '@/modules/record/record.controller'
import { RecordService } from '@/modules/record/record.service'
import { RecordsProvidersModule } from '@/modules/records-providers/records-providers.module'
import { UserModule } from '@/modules/user/user.module'
import { WebsocketModule } from '@/modules/websocket/websocket.module'

@Module({
  imports: [PrismaModule, UserModule, RecordsProvidersModule, WebsocketModule],
  providers: [RecordService],
  controllers: [RecordController],
})
export class RecordModule {}
