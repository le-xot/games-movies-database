import type { GatewayDeps } from '@backend/gateway'
import type { QueueService } from '@backend/modules/queue/queue.service'
import type { StatsService } from '@backend/modules/stats/stats.service'
import type { WeatherService } from '@backend/modules/weather/weather.service'

export interface AnalyticsServices {
  weather: WeatherService
  stats: StatsService
  queue: QueueService
}

/** Читающие порты: погода, статистика и очередь — без преобразований. */
export function analyticsPorts({
  weather,
  stats,
  queue,
}: AnalyticsServices): Pick<GatewayDeps, 'weather' | 'stats' | 'queue'> {
  return { weather, stats, queue }
}
