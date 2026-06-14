import type { RecordWithRelations } from '@/modules/record/entities/record-domain.entity'

export abstract class AuctionRepository {
  abstract findAuctions(): Promise<RecordWithRelations[]>
  abstract selectWinner(id: number): Promise<RecordWithRelations>
}
