import { Module } from '@nestjs/common'
import { PrismaModule } from '@/database/prisma.module'
import { AuctionController } from '@/modules/auction/auction.controller'
import { AuctionService } from '@/modules/auction/auction.service'
import { RecordsProvidersModule } from '@/modules/records-providers/records-providers.module'
import { UserModule } from '@/modules/user/user.module'

@Module({
  imports: [PrismaModule, UserModule, RecordsProvidersModule],
  providers: [AuctionService],
  controllers: [AuctionController],
  exports: [AuctionService],
})
export class AuctionModule {}
