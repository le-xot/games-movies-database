import { Injectable, Logger } from '@nestjs/common'
import { RecordGenre, RecordType } from '@/enums'
import { QueueDto, QueueItemDto } from '@/modules/queue/queue.dto'
import { QueueRepository } from './repositories/queue.repository'

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name)

  constructor(private readonly queueRepository: QueueRepository) {}

  async getQueue(): Promise<QueueDto> {
    const records = await this.queueRepository.findQueueRecords(RecordType.WRITTEN)

    const games = records.filter((r) => r.genre === RecordGenre.GAME)
    const videos = records.filter((r) => r.genre !== RecordGenre.GAME && r.genre !== null)

    this.logger.log(`Queue fetched games=${games.length} videos=${videos.length}`)
    return {
      games: games.map(
        (g): QueueItemDto => ({
          title: g.title,
          login: g.user?.login || 'John Doe',
          userId: g.user?.id || null,
          profileImageUrl: g.user?.profileImageUrl || 'https://via.placeholder.com/150',
          posterUrl: g.posterUrl,
          createdAt: g.createdAt.toLocaleDateString('ru-RU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
          link: g.link,
          type: g.type,
          genre: null,
        }),
      ),
      videos: videos.map(
        (v): QueueItemDto => ({
          title: v.title,
          login: v.user?.login || 'John Doe',
          userId: v.user?.id || null,
          profileImageUrl: v.user?.profileImageUrl || 'https://via.placeholder.com/150',
          posterUrl: v.posterUrl,
          createdAt: v.createdAt.toLocaleDateString('ru-RU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
          link: v.link,
          type: v.type,
          genre: v.genre,
        }),
      ),
    }
  }
}
