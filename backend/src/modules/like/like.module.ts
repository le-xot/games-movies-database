import { Module } from '@nestjs/common'
import { DrizzleModule } from '@/database/drizzle.module'
import { LikeController } from '@/modules/like/like.controller'
import { LikeService } from '@/modules/like/like.service'
import { DrizzleLikeRepository } from '@/modules/like/repositories/drizzle-like.repository'
import { LikeRepository } from '@/modules/like/repositories/like.repository'
import { RecordModule } from '@/modules/record/record.module'
import { UserModule } from '@/modules/user/user.module'
import { WebsocketModule } from '@/modules/websocket/websocket.module'

@Module({
  imports: [DrizzleModule, UserModule, RecordModule, WebsocketModule],
  providers: [LikeService, { provide: LikeRepository, useClass: DrizzleLikeRepository }],
  controllers: [LikeController],
})
export class LikeModule {}
