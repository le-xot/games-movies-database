import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '@/database/prisma.service'
import { RecordType } from '@/enums'
import type { RecordWithRelations } from '@/modules/record/entities/record-domain.entity'
import { AuctionRepository } from './auction.repository'

@Injectable()
export class PrismaAuctionRepository extends AuctionRepository {
  private readonly logger = new Logger(PrismaAuctionRepository.name)

  constructor(private readonly prisma: PrismaService) {
    super()
  }

  findAuctions(): Promise<RecordWithRelations[]> {
    return this.prisma.record.findMany({
      where: { type: RecordType.AUCTION },
      include: { user: true },
    })
  }

  selectWinner(id: number): Promise<RecordWithRelations> {
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
        data: { type: RecordType.WRITTEN },
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
            type: RecordType.AUCTION,
            id: { not: id },
          },
        },
      })

      await tx.record.deleteMany({
        where: {
          type: RecordType.AUCTION,
          id: { not: id },
        },
      })

      return winner
    })
  }
}
