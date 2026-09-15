import { auctionsHistory, likes, records } from '@gmd/database/schema'
import { Injectable, Logger } from '@nestjs/common'
import { and, eq, inArray, ne } from 'drizzle-orm'
import { DrizzleService } from '@/database/drizzle.service'
import { RecordType } from '@/enums'
import type { RecordWithRelations } from '@/modules/record/entities/record-domain.entity'

@Injectable()
export class DrizzleAuctionRepository {
  private readonly logger = new Logger(DrizzleAuctionRepository.name)

  constructor(private readonly drizzle: DrizzleService) {}

  async findAuctions(): Promise<RecordWithRelations[]> {
    return await this.drizzle.db.query.records.findMany({
      where: eq(records.type, RecordType.AUCTION),
    })
  }

  selectWinner(id: number): Promise<RecordWithRelations> {
    return this.drizzle.db.transaction(async (tx) => {
      const record = await tx.query.records.findFirst({ where: eq(records.id, id) })

      if (!record) {
        this.logger.warn(`Record not found for id=${id}`)
        throw new Error(`Record with id ${id} not found`)
      }

      const [winner] = await tx
        .update(records)
        .set({ type: RecordType.WRITTEN })
        .where(eq(records.id, id))
        .returning()

      await tx.insert(auctionsHistory).values({ winnerId: id })

      const otherAuctionIds = tx
        .select({ id: records.id })
        .from(records)
        .where(and(eq(records.type, RecordType.AUCTION), ne(records.id, id)))

      await tx.delete(likes).where(inArray(likes.recordId, otherAuctionIds))
      await tx.delete(records).where(and(eq(records.type, RecordType.AUCTION), ne(records.id, id)))

      return winner
    })
  }
}
