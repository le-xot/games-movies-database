import { Module } from '@nestjs/common'
import { PrismaModule } from '@/database/prisma.module'
import { LikeController } from '@/modules/like/like.controller'
import { LikeService } from '@/modules/like/like.service'
import { LikeRepository } from '@/modules/like/repositories/like.repository'
import { PrismaLikeRepository } from '@/modules/like/repositories/prisma-like.repository'
import { RecordModule } from '@/modules/record/record.module'
import { UserModule } from '@/modules/user/user.module'
import { WebsocketModule } from '@/modules/websocket/websocket.module'

@Module({
  imports: [PrismaModule, UserModule, RecordModule, WebsocketModule],
  providers: [
    LikeService,
    { provide: LikeRepository, useClass: PrismaLikeRepository },
  ],
  controllers: [LikeController],
})
export class LikeModule {}
