import { PrismaService } from '@/database/prisma.service'
import { Injectable } from '@nestjs/common'
import { $Enums } from '@prisma/client'

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

  async getWinner(id: number) {
    return await this.prisma.$transaction(async (tx) => {
      const record = await tx.record.findUnique({
        where: { id },
        include: { user: true },
      })

      if (!record) {
        throw new Error(`Record with id ${id} not found`)
      }

      const winner = await tx.record.update({
        where: { id },
        data: { type: $Enums.RecordType.WRITTEN },
        include: { user: true },
      })

      await tx.auctionsHistory.create({
        data: {
          winner: { connect: { id } },
        },
      })

      await tx.record.deleteMany({
        where: {
          type: $Enums.RecordType.AUCTION,
          id: { not: id },
        },
      })

      return winner
    })
  }
}
