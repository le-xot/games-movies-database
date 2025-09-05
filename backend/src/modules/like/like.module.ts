import { Module } from '@nestjs/common'
import { PrismaModule } from '../../database/prisma.module'
import { RecordModule } from '../record/record.module'
import { UserModule } from '../user/user.module'
import { WebsocketModule } from '../websocket/websocket.module'
import { LikeController } from './like.controller'
import { LikeService } from './like.service'

@Module({
  imports: [PrismaModule, UserModule, RecordModule, WebsocketModule],
  providers: [LikeService],
  controllers: [LikeController],
})
export class LikeModule {}
