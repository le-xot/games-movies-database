import { Elysia } from 'elysia'
import { ApiError, errorBody } from '@/gateway/errors'
import { likeRoutes, type LikesService } from '@/gateway/likes'
import { meRoutes } from '@/gateway/me'
import { queueRoutes, type QueueReader } from '@/gateway/queue'
import { statsRoutes, type StatsReader } from '@/gateway/stats'
import { weatherRoutes, type WeatherReader } from '@/gateway/weather'
import type { Authenticator } from '@/gateway/auth'
import type { RateLimiter } from '@/gateway/rate-limit'

/**
 * Composition root гейтвея: доменные сервисы и инфраструктура передаются явно,
 * без DI-контейнера. Гейтвей не знает ни про Nest, ни про то, как эти штуки
 * создаются.
 */
export interface GatewayDeps {
  weather: WeatherReader
  stats: StatsReader
  queue: QueueReader
  likes: LikesService
  auth: Authenticator
  rateLimit: RateLimiter
}

export function createGateway(deps: GatewayDeps) {
  return new Elysia({ name: 'gateway' })
    .onError(({ code, error, set }) => {
      if (error instanceof ApiError) {
        set.status = error.statusCode
        if (error.headers) set.headers = { ...set.headers, ...error.headers }

        return errorBody(error.statusCode, error.message)
      }

      // Валидация схемы: Elysia присылает VALIDATION с деталями.
      if (code === 'VALIDATION') {
        set.status = 400
        return errorBody(400, error.message)
      }

      if (code === 'NOT_FOUND') {
        set.status = 404
        return errorBody(404, 'Not Found')
      }

      console.error('[gateway] unhandled error', error)
      set.status = 500
      return errorBody(500, 'Internal server error')
    })
    .use(meRoutes(deps))
    .use(weatherRoutes(deps.weather))
    .use(statsRoutes(deps))
    .use(queueRoutes(deps))
    .use(likeRoutes(deps))
}

export type Gateway = ReturnType<typeof createGateway>
