import { Injectable } from '@nestjs/common'
import { $Enums } from '@prisma/client'
import { PrismaService } from '../../database/prisma.service'
import { QueueDto, QueueItemDto } from './queue.dto'

@Injectable()
export class QueueService {
  constructor(private readonly prisma: PrismaService) {}

  async getQueue(): Promise<QueueDto> {
    const records = await this.prisma.record.findMany({
      where: {
        status: { in: [$Enums.RecordStatus.QUEUE, $Enums.RecordStatus.PROGRESS] },
      },
      include: {
        user: true,
      },
    })

    const games = records.filter(r => r.genre === $Enums.RecordGenre.GAME)
    const videos = records.filter(r => r.genre !== $Enums.RecordGenre.GAME && r.genre !== null)

    return {
      games: games.map((g): QueueItemDto => ({
        title: g.title,
        login: g.user?.login || 'John Doe',
        type: g.type,
        genre: null,
      })),
      videos: videos.map((v): QueueItemDto => ({
        title: v.title,
        login: v.user?.login || 'John Doe',
        type: v.type,
        genre: v.genre,
      })),
    }
  }
}
