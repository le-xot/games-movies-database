import { Controller, Get, HttpCode, HttpStatus, Query, UseGuards } from '@nestjs/common'

import { ApiResponse, ApiTags } from '@nestjs/swagger'
import { $Enums } from '@prisma/client'
import { AuthGuard } from '../auth/auth.guard'
import { RolesGuard } from '../auth/auth.roles.guard'
import { RecordEntity } from '../record/record.entity'
import { AuctionService } from './auction.service'

@ApiTags('auction')
@Controller('auction')
export class AuctionController {
  constructor(private auction: AuctionService) {}

  @Get()
  @UseGuards(AuthGuard, new RolesGuard([$Enums.UserRole.ADMIN]))
  @ApiResponse({ status: 200, type: RecordEntity, isArray: true })
  getAuctions(): Promise<RecordEntity[]> {
    return this.auction.getAuctions()
  }

  @Get('winner')
  @UseGuards(AuthGuard, new RolesGuard([$Enums.UserRole.ADMIN]))
  @ApiResponse({ status: 200, description: 'Winner selected successfully', type: RecordEntity })
  @HttpCode(HttpStatus.OK)
  getWinner(@Query('id') id: number): Promise<RecordEntity> {
    return this.auction.getWinner(id)
  }
}
