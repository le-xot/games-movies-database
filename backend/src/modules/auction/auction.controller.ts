import { Controller, Get } from '@nestjs/common'
import { ApiResponse, ApiTags } from '@nestjs/swagger'
import { RecordEntity } from '../record/record.entity'
import { AuctionService } from './auction.service'

@ApiTags('auction')
@Controller('auction')
export class AuctionController {
  constructor(private auction: AuctionService) {}

  @Get()
  @ApiResponse({ status: 200, type: RecordEntity, isArray: true })
  async getAuctions(): Promise<RecordEntity[]> {
    return await this.auction.getAuctions()
  }
}
