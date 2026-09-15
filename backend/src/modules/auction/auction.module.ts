import { Module } from '@nestjs/common'
import { DrizzleModule } from '@/database/drizzle.module'
import { AuctionController } from '@/modules/auction/auction.controller'
import { AuctionService } from '@/modules/auction/auction.service'
import { RecordsProvidersModule } from '@/modules/records-providers/records-providers.module'
import { UserModule } from '@/modules/user/user.module'
import { AuctionRepository } from './repositories/auction.repository'
import { DrizzleAuctionRepository } from './repositories/drizzle-auction.repository'

@Module({
  imports: [DrizzleModule, UserModule, RecordsProvidersModule],
  providers: [
    AuctionService,
    { provide: AuctionRepository, useClass: DrizzleAuctionRepository },
    DrizzleAuctionRepository,
  ],
  controllers: [AuctionController],
  exports: [AuctionService],
})
export class AuctionModule {}
