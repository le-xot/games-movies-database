import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common'
import { ApiResponse, ApiTags } from '@nestjs/swagger'
import { Game, PrismaRoles } from '@prisma/client'
import { AuthGuard } from '../auth/auth.guard'
import { RolesGuard } from '../auth/auth.roles.guard'
import { CreateGameDTO, PatchGameDTO } from './game.dto'
import { GameEntity } from './game.entity'
import { GameServices } from './game.service'

@ApiTags('games')
@Controller('games')
export class GameController {
  constructor(private gameServices: GameServices) {}

  @Post()
  @UseGuards(AuthGuard, new RolesGuard([PrismaRoles.ADMIN]))
  async createGame(@Body() game: CreateGameDTO): Promise<Game> {
    return this.gameServices.createGame(game)
  }

  @Get(':id')
  @UseGuards(AuthGuard, new RolesGuard([PrismaRoles.ADMIN]))
  async findGameById(@Param('id', ParseIntPipe) id: number): Promise<Game> {
    return this.gameServices.findGameById(id)
  }

  @Patch(':id')
  @UseGuards(AuthGuard, new RolesGuard([PrismaRoles.ADMIN]))
  async patchGame(
    @Param('id', ParseIntPipe) id: number,
    @Body() game: PatchGameDTO,
  ): Promise<Game> {
    return this.gameServices.patchGame(id, game)
  }

  @Delete(':id')
  @UseGuards(AuthGuard, new RolesGuard([PrismaRoles.ADMIN]))
  async deleteGame(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.gameServices.deleteGame(id)
  }

  @Get()
  @ApiResponse({ status: 200, type: GameEntity, isArray: true })
  async getAllGames(): Promise<GameEntity[]> {
    return this.gameServices.getAllGames()
  }
}
