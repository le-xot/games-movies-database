import { apiErrorModels, publicErrors } from '@backend/gateway/errors'
import { recordEnumModels } from '@backend/gateway/models'
import { enforceRateLimit, type RateLimiter } from '@backend/gateway/rate-limit'
import { RATE_LIMITS } from '@backend/utils/rate-limits'
import { Elysia, t } from 'elysia'
import type { RecordGenre, RecordType } from '@gmdb/contract'

const { RecordGenre: recordGenreSchema, RecordType: recordTypeSchema } = recordEnumModels

export const QueueItemDto = t.Object({
  title: t.String(),
  link: t.String(),
  posterUrl: t.String(),
  createdAt: t.String(),
  type: t.Nullable(recordTypeSchema),
  genre: t.Nullable(recordGenreSchema),
})

export const QueueDto = t.Object({
  games: t.Array(QueueItemDto),
  videos: t.Array(QueueItemDto),
})

export const queueModels = { QueueItemDto, QueueDto }

export interface QueueItem {
  title: string
  link: string
  posterUrl: string
  createdAt: string
  type: RecordType | null
  genre: RecordGenre | null
}

export interface Queue {
  games: QueueItem[]
  videos: QueueItem[]
}

export interface QueueReader {
  getQueue(): Promise<Queue>
}

export interface QueueRouteDeps {
  queue: QueueReader
  rateLimit: RateLimiter
}

export function queueRoutes({ queue, rateLimit }: QueueRouteDeps) {
  return new Elysia({ name: 'queue' })
    .model({ ...apiErrorModels, ...recordEnumModels, ...queueModels })
    .get(
      '/queue',
      async ({ request, server }) => {
        await enforceRateLimit(rateLimit, {
          request,
          route: 'QueueController.getQueue',
          config: RATE_LIMITS.public,
          ip: server?.requestIP(request)?.address,
        })

        return await queue.getQueue()
      },
      {
        response: {
          200: 'QueueDto' as const,
          ...publicErrors(),
        },
      },
    )
}
