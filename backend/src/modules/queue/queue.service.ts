import { PrismaService } from '@/database/prisma.service'
import { Injectable } from '@nestjs/common'
import { $Enums } from '@prisma/client'
import { QueueDto, QueueItemDto } from './queue.dto'

@Injectable()
export class QueueService {
  constructor(private readonly prisma: PrismaService) {}

  async getQueue(): Promise<QueueDto> {
    const records = await this.prisma.record.findMany({
      where: {
        status: { in: [$Enums.RecordStatus.QUEUE, $Enums.RecordStatus.PROGRESS] },
        type: $Enums.RecordType.WRITTEN,
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
        profileImageUrl: g.user?.profileImageUrl || 'https://via.placeholder.com/150',
        posterUrl: g.posterUrl,
        createdAt: g.createdAt.toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' }),
        link: g.link,
        type: g.type,
        genre: null,
      })),
      videos: videos.map((v): QueueItemDto => ({
        title: v.title,
        login: v.user?.login || 'John Doe',
        profileImageUrl: v.user?.profileImageUrl || 'https://via.placeholder.com/150',
        posterUrl: v.posterUrl,
        createdAt: v.createdAt.toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' }),
        link: v.link,
        type: v.type,
        genre: v.genre,
      })),
    }
  }
}
