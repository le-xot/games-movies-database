import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common'
import { ApiResponse, ApiTags } from '@nestjs/swagger'
import { AuthGuard } from '../auth/auth.guard'
import { User } from '../auth/auth.user.decorator'
import { RecordEntity } from '../record/record.entity'
import { UserEntity } from '../user/user.entity'
import { SuggestionService } from './suggestion.service'
import { UserSuggestionDTO } from './suggesttion.dto'

@ApiTags('suggestions')
@Controller('suggestions')
export class SuggestionController {
  constructor(private suggestionService: SuggestionService) {}

  @Get()
  @ApiResponse({ status: 200, type: RecordEntity, isArray: true })
  async getSuggestions(): Promise<RecordEntity[]> {
    return await this.suggestionService.getSuggestions()
  }

  @Post()
  @UseGuards(AuthGuard)
  @ApiResponse({ status: 200, description: 'Returns created suggestion' })
  async userSuggest(@Body() suggest: UserSuggestionDTO, @User() user: UserEntity): Promise<any> {
    return await this.suggestionService.userSuggest({ link: suggest.link, userId: user.id })
  }
}
