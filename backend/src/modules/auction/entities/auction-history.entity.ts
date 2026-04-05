export interface AuctionHistoryDomain {
  id: number;
  recordId: number;
  startedAt: Date;
  endedAt?: Date;
  winnerId?: string;
}
