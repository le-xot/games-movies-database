import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common'
import { ApiResponse, ApiTags } from '@nestjs/swagger'
import { UserRole } from '@/enums'
import { AuthGuard } from '@/modules/auth/auth.guard'
import { RolesGuard } from '@/modules/auth/auth.roles.guard'
import { RateLimit } from '@/modules/rate-limit/rate-limit.decorator'
import { RATE_LIMITS } from '@/utils/rate-limits'
import { SteamGamesResponseDTO, SteamImportDTO, SteamImportResultDTO } from './steam.dto'
import { SteamService } from './steam.service'

@ApiTags('steam')
@Controller('steam')
export class SteamController {
  constructor(private readonly steamService: SteamService) {}

  @Get('games')
  @RateLimit(RATE_LIMITS.public)
  @UseGuards(AuthGuard, new RolesGuard([UserRole.ADMIN]))
  @ApiResponse({ status: 200, type: SteamGamesResponseDTO })
  async getSteamGames(): Promise<SteamGamesResponseDTO> {
    const [games, existingIds] = await Promise.all([
      this.steamService.getOwnedGames(),
      this.steamService.getExistingAppIds(),
    ])
    return { games, existingAppIds: [...existingIds] }
  }

  @Post('import')
  @RateLimit(RATE_LIMITS.write)
  @UseGuards(AuthGuard, new RolesGuard([UserRole.ADMIN]))
  @ApiResponse({ status: 201, type: SteamImportResultDTO })
  async importSteamGames(@Body() body: SteamImportDTO): Promise<SteamImportResultDTO> {
    return await this.steamService.importGames(body.games)
  }
}
