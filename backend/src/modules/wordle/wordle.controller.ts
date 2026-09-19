import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common'
import { ApiResponse, ApiTags } from '@nestjs/swagger'
import { UserRole } from '@/enums'
import { AuthGuard } from '@/modules/auth/auth.guard'
import { RolesGuard } from '@/modules/auth/auth.roles.guard'
import { User } from '@/modules/auth/auth.user.decorator'
import { RateLimit } from '@/modules/rate-limit/rate-limit.decorator'
import { UserEntity } from '@/modules/user/user.entity'
import {
  WordleGuessDTO,
  WordleLeaderboardDTO,
  WordleStateDTO,
  WordleStatsDTO,
} from '@/modules/wordle/wordle.dto'
import { WordleService } from '@/modules/wordle/wordle.service'
import { RATE_LIMITS } from '@/utils/rate-limits'

@ApiTags('wordle')
@Controller('wordle')
@UseGuards(AuthGuard, new RolesGuard([UserRole.USER, UserRole.ADMIN]))
export class WordleController {
  constructor(private readonly wordleService: WordleService) {}

  @Get('state')
  @ApiResponse({ status: 200, type: WordleStateDTO })
  getState(@User() user: UserEntity): Promise<WordleStateDTO> {
    return this.wordleService.getState(user.id)
  }

  @Post('guess')
  @RateLimit(RATE_LIMITS.write)
  @ApiResponse({ status: 200, type: WordleStateDTO })
  makeGuess(@Body() body: WordleGuessDTO, @User() user: UserEntity): Promise<WordleStateDTO> {
    return this.wordleService.makeGuess(user.id, body.word)
  }

  @Get('stats')
  @ApiResponse({ status: 200, type: WordleStatsDTO })
  getStats(@User() user: UserEntity): Promise<WordleStatsDTO> {
    return this.wordleService.getStats(user.id)
  }

  @Get('leaderboard')
  @ApiResponse({ status: 200, type: WordleLeaderboardDTO })
  getLeaderboard(): Promise<WordleLeaderboardDTO> {
    return this.wordleService.getLeaderboard()
  }
}
