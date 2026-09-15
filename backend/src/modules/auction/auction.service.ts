import { Injectable, Logger } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import {
  WsEvents,
  type UpdateAuctionPayload,
  type UpdateRecordsPayload,
} from '@/modules/websocket/websocket.events'
import { DrizzleAuctionRepository } from './repositories/drizzle-auction.repository'

@Injectable()
export class AuctionService {
  private readonly logger = new Logger(AuctionService.name)
  constructor(
    private readonly auctionRepository: DrizzleAuctionRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  getAuctions() {
    this.logger.log('Fetching auctions')
    return this.auctionRepository.findAuctions()
  }

  async getWinner(id: number) {
    const winner = await this.auctionRepository.selectWinner(id)

    this.eventEmitter.emit(WsEvents.UPDATE_AUCTION, {
      id,
      action: 'ended',
    } satisfies UpdateAuctionPayload)
    this.eventEmitter.emit(WsEvents.UPDATE_RECORDS, {
      genre: winner.genre,
      id,
      action: 'updated',
    } satisfies UpdateRecordsPayload)
    this.logger.log(`Auction winner chosen id=${id}`)
    return winner
  }
}
