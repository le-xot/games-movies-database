import { Module } from '@nestjs/common'
import { DrizzleModule } from '@/database/drizzle.module'
import { LikeController } from '@/modules/like/like.controller'
import { LikeService } from '@/modules/like/like.service'
import { DrizzleLikeRepository } from '@/modules/like/repositories/drizzle-like.repository'
import { UserModule } from '@/modules/user/user.module'

@Module({
  imports: [DrizzleModule, UserModule],
  providers: [LikeService, DrizzleLikeRepository],
  controllers: [LikeController],
})
export class LikeModule {}
