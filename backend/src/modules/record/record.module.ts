import { Module } from '@nestjs/common'
import { DrizzleModule } from '@/database/drizzle.module'
import { ImgModule } from '@/modules/img/img.module'
import { RecordController } from '@/modules/record/record.controller'
import { RecordService } from '@/modules/record/record.service'
import { RecordRepository } from '@/modules/record/repositories/record.repository'
import { RecordsProvidersModule } from '@/modules/records-providers/records-providers.module'
import { UserModule } from '@/modules/user/user.module'
import { WebsocketModule } from '@/modules/websocket/websocket.module'
import { DrizzleRecordRepository } from './repositories/drizzle-record.repository'

@Module({
  imports: [DrizzleModule, UserModule, RecordsProvidersModule, WebsocketModule, ImgModule],
  providers: [RecordService, { provide: RecordRepository, useClass: DrizzleRecordRepository }],
  controllers: [RecordController],
  exports: [RecordRepository],
})
export class RecordModule {}
