import { Injectable, Logger } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { RecordGenre } from '@/enums'
import type {
  UpdateAuctionPayload,
  UpdateRecordsPayload,
} from '@/modules/websocket/websocket.events'
import { AuctionRepository } from './repositories/auction.repository'

@Injectable()
export class AuctionService {
  private readonly logger = new Logger(AuctionService.name)
  constructor(
    private readonly auctionRepository: AuctionRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  getAuctions() {
    this.logger.log('Fetching auctions')
    return this.auctionRepository.findAuctions()
  }

  async getWinner(id: number) {
    const winner = await this.auctionRepository.selectWinner(id)

    this.eventEmitter.emit('update-auction', {
      id,
      action: 'ended',
    } satisfies UpdateAuctionPayload)
    this.eventEmitter.emit('update-records', {
      genre: winner.genre as unknown as RecordGenre,
      id,
      action: 'updated',
    } satisfies UpdateRecordsPayload)
    this.logger.log(`Auction winner chosen id=${id}`)
    return winner
  }
}
