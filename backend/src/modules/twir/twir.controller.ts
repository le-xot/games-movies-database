import { Body, Controller, Post, UseGuards } from '@nestjs/common'
import { ApiResponse } from '@nestjs/swagger'
import { ApikeyGuard } from '../auth/auth.apikey.guard'
import { SuggestionCreateByTwirDTO } from './twir.dto'
import { TwirService } from './twir.service'

@Controller('twir')
export class TwirController {
  constructor(private twirService: TwirService) {}

  @Post('suggestion')
  @UseGuards(ApikeyGuard)
  @ApiResponse({ status: 200, description: 'Returns created suggestion' })
  async createSuggestionWithTwir(@Body() data: SuggestionCreateByTwirDTO) {
    return await this.twirService.createSuggestionWithTwir(data)
  }
}
