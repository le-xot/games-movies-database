import { Module } from '@nestjs/common'
import { DrizzleModule } from '@/database/drizzle.module'
import { ImgModule } from '@/modules/img/img.module'
import { RecordController } from '@/modules/record/record.controller'
import { RecordService } from '@/modules/record/record.service'
import { RecordsProvidersModule } from '@/modules/records-providers/records-providers.module'
import { UserModule } from '@/modules/user/user.module'
import { DrizzleRecordRepository } from './repositories/drizzle-record.repository'

@Module({
  imports: [DrizzleModule, UserModule, RecordsProvidersModule, ImgModule],
  providers: [RecordService, DrizzleRecordRepository],
  controllers: [RecordController],
  exports: [DrizzleRecordRepository],
})
export class RecordModule {}
