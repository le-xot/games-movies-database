import { Module } from '@nestjs/common'
import { PrismaModule } from '@/database/prisma.module'
import { PrismaRecordRepository } from '@/modules/record/repositories/prisma-record.repository'
import { RecordRepository } from '@/modules/record/repositories/record.repository'
import { RecordController } from '@/modules/record/record.controller'
import { RecordService } from '@/modules/record/record.service'
import { RecordsProvidersModule } from '@/modules/records-providers/records-providers.module'
import { UserModule } from '@/modules/user/user.module'
import { WebsocketModule } from '@/modules/websocket/websocket.module'

@Module({
  imports: [PrismaModule, UserModule, RecordsProvidersModule, WebsocketModule],
  providers: [
    RecordService,
    { provide: RecordRepository, useClass: PrismaRecordRepository },
  ],
  controllers: [RecordController],
})
export class RecordModule {}
