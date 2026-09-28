import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common'
import { ApiResponse, ApiTags } from '@nestjs/swagger'
import { UserRole } from '@/enums'
import { AuthGuard } from '@/modules/auth/auth.guard'
import { RolesGuard } from '@/modules/auth/auth.roles.guard'
import { User } from '@/modules/auth/auth.user.decorator'
import { RateLimit } from '@/modules/rate-limit/rate-limit.decorator'
import { RecordEntity } from '@/modules/record/record.entity'
import { SuggestionService } from '@/modules/suggestion/suggestion.service'
import { UserSuggestionDTO, UserSuggestionResponseDTO } from '@/modules/suggestion/suggesttion.dto'
import { UserEntity } from '@/modules/user/user.entity'
import { ApiErrors } from '@/utils/api-errors'
import { RATE_LIMITS } from '@/utils/rate-limits'

@ApiTags('suggestions')
@ApiErrors()
@Controller('suggestions')
export class SuggestionController {
  constructor(private suggestionService: SuggestionService) {}

  @Get()
  @ApiResponse({ status: 200, type: RecordEntity, isArray: true })
  async getSuggestions(): Promise<RecordEntity[]> {
    return await this.suggestionService.getSuggestions()
  }

  @Post()
  @RateLimit(RATE_LIMITS.suggestion)
  @UseGuards(AuthGuard, new RolesGuard([UserRole.USER, UserRole.ADMIN]))
  @ApiResponse({
    status: 200,
    description: 'Returns created suggestion',
    type: UserSuggestionResponseDTO,
  })
  async userSuggest(
    @Body() suggest: UserSuggestionDTO,
    @User() user: UserEntity,
  ): Promise<UserSuggestionResponseDTO> {
    return await this.suggestionService.userSuggest({ link: suggest.link, userId: user.id })
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @ApiResponse({ status: 204, description: 'Suggestion deleted successfully' })
  async deleteUserSuggestion(@Param('id') id: number, @User() user: UserEntity): Promise<void> {
    await this.suggestionService.deleteUserSuggestion(id, user.id)
  }
}
