import { Module } from '@nestjs/common'
import { PrismaModule } from '@/database/prisma.module'
import { AuctionController } from '@/modules/auction/auction.controller'
import { AuctionService } from '@/modules/auction/auction.service'
import { RecordsProvidersModule } from '@/modules/records-providers/records-providers.module'
import { UserModule } from '@/modules/user/user.module'
import { AuctionRepository } from './repositories/auction.repository'
import { PrismaAuctionRepository } from './repositories/prisma-auction.repository'

@Module({
  imports: [PrismaModule, UserModule, RecordsProvidersModule],
  providers: [
    AuctionService,
    { provide: AuctionRepository, useClass: PrismaAuctionRepository },
    PrismaAuctionRepository,
  ],
  controllers: [AuctionController],
  exports: [AuctionService],
})
export class AuctionModule {}
