import { Module } from '@nestjs/common'
import { DrizzleModule } from '@/database/drizzle.module'
import { AuctionController } from '@/modules/auction/auction.controller'
import { AuctionService } from '@/modules/auction/auction.service'
import { UserModule } from '@/modules/user/user.module'
import { DrizzleAuctionRepository } from './repositories/drizzle-auction.repository'

@Module({
  imports: [DrizzleModule, UserModule],
  providers: [AuctionService, DrizzleAuctionRepository],
  controllers: [AuctionController],
  exports: [AuctionService],
})
export class AuctionModule {}
