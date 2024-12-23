import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../database/prisma.service'
import { CreateGameDTO, PatchGameDTO } from './game.dto'
import { GameEntity } from './game.entity'

@Injectable()
export class GameServices {
  constructor(private prisma: PrismaService) {}

  async createGame(game: CreateGameDTO): Promise<GameEntity> {
    return this.prisma.game.create({
      data: game,
      include: {
        person: true,
      },
    })
  }

  async patchGame(id: number, game: PatchGameDTO): Promise<GameEntity> {
    const foundedGame = await this.prisma.game.findUnique({
      where: { id },
    })
    if (!foundedGame) {
      throw new Error('Game not found')
    }
    return this.prisma.game.update({
      where: { id },
      include: { person: true },
      data: { ...foundedGame, ...game },
    })
  }

  async deleteGame(id: number): Promise<void> {
    await this.prisma.game.delete({ where: { id } })
  }

  async getAllGames(): Promise<GameEntity[]> {
    return this.prisma.game.findMany({
      include: { person: true },
      orderBy: {
        id: 'desc',
      },
    })
  }

  async findGameById(id: number): Promise<GameEntity> {
    return this.prisma.game.findUnique({
      where: { id },
      include: {
        person: true,
      },
    })
  }
}
