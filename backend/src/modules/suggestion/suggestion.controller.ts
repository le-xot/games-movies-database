import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common'
import { ApiResponse, ApiTags } from '@nestjs/swagger'
import { $Enums } from '@prisma/client'
import { AuthGuard } from '../auth/auth.guard'
import { RolesGuard } from '../auth/auth.roles.guard'
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
  getSuggestions(): Promise<RecordEntity[]> {
    return this.suggestionService.getSuggestions()
  }

  @Post()
  @UseGuards(AuthGuard, new RolesGuard([$Enums.UserRole.USER, $Enums.UserRole.ADMIN]))
  @ApiResponse({ status: 200, description: 'Returns created suggestion' })
  async userSuggest(@Body() suggest: UserSuggestionDTO, @User() user: UserEntity): Promise<any> {
    return await this.suggestionService.userSuggest({ link: suggest.link, userId: user.id })
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @ApiResponse({ status: 204, description: 'Suggestion deleted successfully' })
  async deleteUserSuggestion(@Param('id') id: number, @User() user: UserEntity): Promise<void> {
    await this.suggestionService.deleteUserSuggestion(id, user.id)
  }
}
