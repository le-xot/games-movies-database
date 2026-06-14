import { Body, Controller, Post, UseGuards } from '@nestjs/common'
import { ApiResponse } from '@nestjs/swagger'
import { ApikeyGuard } from '@/modules/auth/auth.apikey.guard'
import { SuggestionCreateByTwirDTO } from '@/modules/twir/twir.dto'
import { TwirService } from '@/modules/twir/twir.service'

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
