import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common'
import { ApiResponse, ApiTags } from '@nestjs/swagger'
import { $Enums } from '@prisma/client'
import { AuthGuard } from '../auth/auth.guard'
import { RolesGuard } from '../auth/auth.roles.guard'
import { User } from '../auth/auth.user.decorator'
import { UserEntity } from '../user/user.entity'
import { SuggestionService } from './suggestion.service'
import { SuggestionsDto, UserSuggestionDTO } from './suggesttion.dto'

@ApiTags('suggestions')
@Controller('suggestions')
export class SuggestionController {
  constructor(private suggestionService: SuggestionService) {}

  @Get()
  @ApiResponse({ status: 200, type: SuggestionsDto })
  async getSuggestions(): Promise<SuggestionsDto> {
    return await this.suggestionService.getSuggestions()
  }

  @Delete(':id')
  @UseGuards(AuthGuard, new RolesGuard([$Enums.PrismaRoles.ADMIN]))
  @ApiResponse({ status: 204 })
  async deleteSuggestion(@Param('id') id: number): Promise<void> {
    await this.suggestionService.deleteSuggestion(id)
  }

  @Post()
  @UseGuards(AuthGuard)
  @ApiResponse({ status: 200, description: 'Returns created suggestion' })
  async userSuggest(@Body() suggest: UserSuggestionDTO, @User() user: UserEntity): Promise<any> {
    return await this.suggestionService.userSuggest(suggest, user.id)
  }
}
