import { Injectable } from '@nestjs/common'
import { $Enums } from '@prisma/client'
import { PrismaService } from '../../database/prisma.service'
import { QueueDto, QueueItemDto, QueueType } from './queue.dto'

@Injectable()
export class QueueService {
  constructor(private readonly prisma: PrismaService) {}

  async getQueue(): Promise<QueueDto> {
    const [games, videos] = await Promise.all([
      this.prisma.game.findMany({
        where: { status: { in: [$Enums.PrismaStatuses.QUEUE, $Enums.PrismaStatuses.PROGRESS] } },
        select: { title: true, person: { select: { name: true } } },
      }),
      this.prisma.video.findMany({
        where: { status: { in: [$Enums.PrismaStatuses.QUEUE, $Enums.PrismaStatuses.PROGRESS] } },
        select: { title: true, person: { select: { name: true } }, genre: true },
      }),
    ])
    return {
      games: games.map((g): QueueItemDto => ({
        title: g.title,
        type: QueueType.GAME,
        personName: g.person.name,
        genre: null,
      })),
      videos: videos.map((v): QueueItemDto => ({
        title: v.title,
        type: QueueType.VIDEO,
        personName: v.person.name,
        genre: v.genre,
      })),
    }
  }
}
