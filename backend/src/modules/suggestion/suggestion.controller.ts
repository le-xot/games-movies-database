import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common'
import { ApiResponse, ApiTags } from '@nestjs/swagger'
import { Throttle } from '@nestjs/throttler'
import { $Enums } from '@prisma/client'
import { AuthGuard } from '@/modules/auth/auth.guard'
import { RolesGuard } from '@/modules/auth/auth.roles.guard'
import { User } from '@/modules/auth/auth.user.decorator'
import { RecordEntity } from '@/modules/record/record.entity'
import { SuggestionService } from '@/modules/suggestion/suggestion.service'
import { UserSuggestionDTO } from '@/modules/suggestion/suggesttion.dto'
import { UserEntity } from '@/modules/user/user.entity'

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
  @Throttle({ default: { ttl: 60000, limit: 10 } })
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
