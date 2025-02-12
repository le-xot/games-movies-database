import { Injectable, NotFoundException } from '@nestjs/common'
import { $Enums, Prisma } from '@prisma/client'
import { PrismaService } from '../../database/prisma.service'
import { CreateGameDTO, GetGamesDto, PatchGameDTO } from './game.dto'
import { GameEntity } from './game.entity'

@Injectable()
export class GameService {
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
      throw new NotFoundException('Game not found')
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

  async getAllGames(
    page: number = 1,
    limit: number = 10,
    filters?: {
      search?: string
      personId?: number
      type?: $Enums.PrismaTypes
      status?: $Enums.PrismaStatuses
      grade?: $Enums.PrismaGrades
    },
    orderBy?: 'title' | 'id',
    direction?: 'asc' | 'desc',
  ): Promise<GetGamesDto> {
    const skip = (page - 1) * limit
    const where: Prisma.GameWhereInput = {}

    if (filters?.search) {
      where.OR = [
        {
          title: {
            contains: filters.search,
            mode: Prisma.QueryMode.insensitive,
          },
        },
        {
          person: {
            name: {
              contains: filters.search,
              mode: Prisma.QueryMode.insensitive,
            },
          },
        },
      ]
    }

    if (filters?.personId) {
      where.personId = filters.personId
    }

    if (filters?.type) {
      where.type = filters.type
    }

    if (filters?.status) {
      where.status = filters.status
    }

    if (filters?.grade) {
      where.grade = filters.grade
    }

    const total = await this.prisma.game.count({
      where: Object.keys(where).length > 0 ? where : undefined,
    })

    const games = await this.prisma.game.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      include: { person: true },
      orderBy: {
        [orderBy || 'id']: direction || 'asc',
      },
      skip,
      take: limit,
    })

    return { games, total }
  }

  async findGameById(id: number): Promise<GameEntity> {
    const game = await this.prisma.game.findUnique({
      where: { id },
      include: {
        person: true,
      },
    })
    if (!game) {
      throw new NotFoundException('Game not found')
    }
    return game
  }
}
