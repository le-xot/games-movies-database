import { Elysia } from 'elysia'
import { authSessionRoutes, type AuthSessionPort } from '@/gateway/auth-session'
import { errorBody, fromDomainError } from '@/gateway/errors'
import { healthRoutes } from '@/gateway/health'
import { likeRoutes, type LikesService } from '@/gateway/likes'
import { limitRoutes, type LimitsService } from '@/gateway/limits'
import { meRoutes } from '@/gateway/me'
import { queueRoutes, type QueueReader } from '@/gateway/queue'
import { ratingRoutes, type RatingsService } from '@/gateway/ratings'
import { recordRoutes, type RecordsService } from '@/gateway/records'
import { statsRoutes, type StatsReader } from '@/gateway/stats'
import { suggestionRoutes, type SuggestionsService } from '@/gateway/suggestions'
import { twirRoutes, type TwirService } from '@/gateway/twir'
import { userRoutes, type UsersService } from '@/gateway/users'
import { weatherRoutes, type WeatherReader } from '@/gateway/weather'
import {
  wordleRoutes,
  type WordleNotificationsPort,
  type WordleServicePort,
} from '@/gateway/wordle'
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
  records: RecordsService
  ratings: RatingsService
  users: UsersService
  suggestions: SuggestionsService
  limits: LimitsService
  twir: TwirService
  twirApiKey: string | undefined
  authSession: AuthSessionPort
  wordle: WordleServicePort
  wordleNotifications: WordleNotificationsPort
  auth: Authenticator
  rateLimit: RateLimiter
}

export function createGateway(deps: GatewayDeps) {
  return new Elysia({ name: 'gateway' })
    .onError(({ code, error, set }) => {
      const httpError = fromDomainError(error)

      if (httpError) {
        set.status = httpError.statusCode
        if (httpError.headers) set.headers = { ...set.headers, ...httpError.headers }

        return errorBody(httpError.statusCode, httpError.message)
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
    .use(authSessionRoutes(deps))
    .use(weatherRoutes(deps.weather))
    .use(statsRoutes(deps))
    .use(queueRoutes(deps))
    .use(likeRoutes(deps))
    .use(recordRoutes(deps))
    .use(ratingRoutes(deps))
    .use(userRoutes(deps))
    .use(suggestionRoutes(deps))
    .use(limitRoutes(deps))
    .use(twirRoutes({ twir: deps.twir, rateLimit: deps.rateLimit, apiKey: deps.twirApiKey }))
    .use(healthRoutes(deps))
    .use(wordleRoutes(deps))
}

export type Gateway = ReturnType<typeof createGateway>
