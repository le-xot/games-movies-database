import { Injectable, Logger } from '@nestjs/common'
import { RecordGenre, RecordType } from '@/enums'
import { QueueDto, QueueItemDto } from '@/modules/queue/queue.dto'
import { DrizzleQueueRepository } from './repositories/drizzle-queue.repository'

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name)

  constructor(private readonly queueRepository: DrizzleQueueRepository) {}

  async getQueue(): Promise<QueueDto> {
    const records = await this.queueRepository.findQueueRecords(RecordType.WRITTEN)

    const toQueueItem = (
      record: (typeof records)[number],
      genre: RecordGenre | null,
    ): QueueItemDto => ({
      title: record.title,
      posterUrl: record.posterUrl,
      createdAt: record.createdAt.toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      link: record.link,
      type: record.type,
      genre,
    })

    const games = records.filter((r) => r.genre === RecordGenre.GAME)
    const videos = records.filter((r) => r.genre !== RecordGenre.GAME && r.genre !== null)

    this.logger.log(`Queue fetched games=${games.length} videos=${videos.length}`)
    return {
      games: games.map((game) => toQueueItem(game, null)),
      videos: videos.map((video) => toQueueItem(video, video.genre ?? null)),
    }
  }
}
