import { PrismaService } from '@/database/prisma.service'
import { Injectable, Logger } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { $Enums } from '@prisma/client'

@Injectable()
export class AuctionService {
  private readonly logger = new Logger(AuctionService.name)
  constructor(private prisma: PrismaService, private readonly eventEmitter: EventEmitter2) {}

  getAuctions() {
    this.logger.log('Fetching auctions')
    return this.prisma.record.findMany({
      where: { type: $Enums.RecordType.AUCTION },
      include: { user: true },
    })
  }

  getWinner(id: number) {
    return this.prisma.$transaction(async (tx) => {
      const record = await tx.record.findUnique({
        where: { id },
        include: { user: true },
      })

      if (!record) {
        this.logger.warn(`Record not found for id=${id}`)
        throw new Error(`Record with id ${id} not found`)
      }

      const winner = await tx.record.update({
        where: { id },
        data: { type: $Enums.RecordType.WRITTEN },
        include: { user: true },
      })

      await tx.auctionsHistory.create({
        data: {
          winnerId: id,
        },
      })

      await tx.like.deleteMany({
        where: {
          record: {
            type: $Enums.RecordType.AUCTION,
            id: { not: id },
          },
        },
      })

      await tx.record.deleteMany({
        where: {
          type: $Enums.RecordType.AUCTION,
          id: { not: id },
        },
      })

      this.eventEmitter.emit('update-auction')
      this.eventEmitter.emit('update-records', { genre: winner.genre })
      this.logger.log(`Auction winner chosen id=${id}`)
      return winner
    })
  }
}
