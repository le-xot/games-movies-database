import { Module } from '@nestjs/common'
import { DrizzleModule } from '@/database/drizzle.module'
import { RatingController } from '@/modules/rating/rating.controller'
import { RatingService } from '@/modules/rating/rating.service'
import { DrizzleRatingRepository } from '@/modules/rating/repositories/drizzle-rating.repository'
import { UserModule } from '@/modules/user/user.module'

@Module({
  imports: [DrizzleModule, UserModule],
  providers: [RatingService, DrizzleRatingRepository],
  controllers: [RatingController],
  exports: [DrizzleRatingRepository],
})
export class RatingModule {}
