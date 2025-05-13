import { Injectable } from '@nestjs/common'
import { $Enums } from '@prisma/client'
import { PrismaService } from 'src/database/prisma.service'

@Injectable()
export class AuctionService {
  constructor(private prisma: PrismaService) {}

  async getAuctions() {
    const auctions = await this.prisma.record.findMany({
      where: { type: $Enums.RecordType.AUCTION },
      include: { user: true },
    })
    return auctions
  }
}
