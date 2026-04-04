import { Module } from '@nestjs/common'
import { PrismaModule } from '@/database/prisma.module'
import { LikeController } from '@/modules/like/like.controller'
import { LikeService } from '@/modules/like/like.service'
import { RecordModule } from '@/modules/record/record.module'
import { UserModule } from '@/modules/user/user.module'
import { WebsocketModule } from '@/modules/websocket/websocket.module'

@Module({
  imports: [PrismaModule, UserModule, RecordModule, WebsocketModule],
  providers: [LikeService],
  controllers: [LikeController],
})
export class LikeModule {}
