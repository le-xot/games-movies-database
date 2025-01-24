import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { ApiResponse, ApiTags } from '@nestjs/swagger'
import { $Enums } from '@prisma/client'
import { AuthGuard } from '../auth/auth.guard'
import { RolesGuard } from '../auth/auth.roles.guard'
import { CreateGameDTO, GetGameDTO, PatchGameDTO } from './game.dto'
import { GameEntity } from './game.entity'
import { GameServices } from './game.service'

@ApiTags('games')
@Controller('games')
export class GameController {
  constructor(private gameServices: GameServices) {}

  @Post()
  @UseGuards(AuthGuard, new RolesGuard([$Enums.PrismaRoles.ADMIN]))
  @ApiResponse({ status: 201, type: GameEntity })
  async createGame(@Body() game: CreateGameDTO): Promise<GameEntity> {
    return this.gameServices.createGame(game)
  }

  @Get(':id')
  @UseGuards(AuthGuard, new RolesGuard([$Enums.PrismaRoles.ADMIN]))
  @ApiResponse({ status: 200, type: GameEntity })
  @ApiResponse({ status: 404, description: 'Game not found' })
  async findGameById(@Param('id') id: number): Promise<GameEntity> {
    const game = await this.gameServices.findGameById(id)
    if (!game) {
      throw new NotFoundException('Game not found')
    }
    return game
  }

  @Patch(':id')
  @UseGuards(AuthGuard, new RolesGuard([$Enums.PrismaRoles.ADMIN]))
  @ApiResponse({ status: 200, type: GameEntity })
  async patchGame(
    @Param('id') id: number,
    @Body() game: PatchGameDTO,
  ): Promise<GameEntity> {
    return this.gameServices.patchGame(id, game)
  }

  @Delete(':id')
  @UseGuards(AuthGuard, new RolesGuard([$Enums.PrismaRoles.ADMIN]))
  @ApiResponse({ status: 204 })
  async deleteGame(@Param('id') id: number): Promise<void> {
    await this.gameServices.deleteGame(id)
  }

  @Get()
  @ApiResponse({ status: 200, type: GameEntity, isArray: true })
  async getAllGames(@Query() query: GetGameDTO): Promise<{ games: GameEntity[], total: number }> {
    const { page, limit, orderBy, direction, ...filters } = query
    const { games, total } = await this.gameServices.getAllGames(page, limit, filters, orderBy, direction)
    return { games, total }
  }
}
