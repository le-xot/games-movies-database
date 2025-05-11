import { Module } from '@nestjs/common'
import { PrismaModule } from '../../database/prisma.module'
import { UserModule } from '../user/user.module'
import { RecordController } from './record.controller'
import { RecordService } from './record.service'

@Module({
  imports: [PrismaModule, UserModule],
  providers: [RecordService],
  controllers: [RecordController],
})
export class RecordModule {}
