import { Module } from '@nestjs/common'
import { PrismaModule } from 'src/database/prisma.module'
import { RecordsProvidersModule } from '../records-providers/records-providers.module'
import { UserModule } from '../user/user.module'
import { AuctionController } from './auction.controller'
import { AuctionService } from './auction.service'

@Module({
  imports: [PrismaModule, UserModule, RecordsProvidersModule],
  providers: [AuctionService],
  controllers: [AuctionController],
  exports: [AuctionService],
})
export class AuctionModule {}
