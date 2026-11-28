import type { GatewayDeps } from '@backend/gateway'
import type { QueueItem } from '@backend/gateway/queue'
import type { Queue } from '@backend/modules/queue/queue.entity'
import type { QueueService } from '@backend/modules/queue/queue.service'
import type { StatsService } from '@backend/modules/stats/stats.service'
import type { WeatherService } from '@backend/modules/weather/weather.service'

export interface AnalyticsServices {
  weather: WeatherService
  stats: StatsService
  queue: QueueService
}

const QUEUE_DATE_FORMAT: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
}

function toQueueItem(item: Queue['games'][number]): QueueItem {
  return {
    ...item,
    // Единственное преобразование проводки: ISO → человеческая дата.
    createdAt: new Date(item.createdAt).toLocaleDateString('ru-RU', QUEUE_DATE_FORMAT),
  }
}

/** Читающие порты: погода и статистика — как есть; очередь форматирует дату для UI. */
export function analyticsPorts({
  weather,
  stats,
  queue,
}: AnalyticsServices): Pick<GatewayDeps, 'weather' | 'stats' | 'queue'> {
  return {
    weather,
    stats,
    queue: {
      getQueue: async () => {
        const domain = await queue.getQueue()

        return {
          games: domain.games.map(toQueueItem),
          videos: domain.videos.map(toQueueItem),
        }
      },
    },
  }
}
