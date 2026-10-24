import { Elysia, t } from 'elysia'
import { apiErrorModels, standardErrors } from '@/gateway/errors'
import { recordEnumModels } from '@/gateway/models'
import { enforceRateLimit, type RateLimiter } from '@/gateway/rate-limit'
import { RATE_LIMITS } from '@/utils/rate-limits'

export const queueModels = {
  QueueItemDto: t.Object({
    title: t.String(),
    link: t.String(),
    posterUrl: t.String(),
    createdAt: t.String(),
    type: t.Nullable(t.Ref('RecordType')),
    genre: t.Nullable(t.Ref('RecordGenre')),
  }),
  QueueDto: t.Object({
    games: t.Array(t.Ref('QueueItemDto')),
    videos: t.Array(t.Ref('QueueItemDto')),
  }),
}

export type Queue = typeof queueModels.QueueDto.static

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
          ...standardErrors({ auth: false }),
        },
      },
    )
}
