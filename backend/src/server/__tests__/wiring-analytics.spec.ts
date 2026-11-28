import { describe, expect, it } from 'bun:test'
import { analyticsPorts } from '@backend/server/wiring/analytics'
import type { QueueService } from '@backend/modules/queue/queue.service'
import type { StatsService } from '@backend/modules/stats/stats.service'
import type { WeatherService } from '@backend/modules/weather/weather.service'

function build(queue: QueueService) {
  return analyticsPorts({
    weather: {} as WeatherService,
    stats: {} as StatsService,
    queue,
  })
}

describe('analyticsPorts', () => {
  it('форматирует дату очереди для UI, оставляя остальные поля', async () => {
    const createdAt = '2026-01-02T03:04:05.000Z'
    const queue = {
      getQueue: async () => ({
        games: [
          {
            title: 'Game',
            link: '/g',
            posterUrl: '',
            createdAt,
            type: 'WRITTEN' as const,
            genre: null,
          },
        ],
        videos: [],
      }),
    } as unknown as QueueService

    const ports = build(queue)
    const result = await ports.queue.getQueue()

    expect(result.games[0]).toMatchObject({ title: 'Game', link: '/g' })
    expect(result.games[0]?.createdAt).toBe(
      new Date(createdAt).toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    )
    expect(result.games[0]?.createdAt).not.toBe(createdAt)
  })

  it('погода и статистика уходят в гейтвей без обёрток', () => {
    const ports = build({} as QueueService)

    expect(ports.weather).toEqual({} as WeatherService)
    expect(ports.stats).toEqual({} as StatsService)
  })
})
