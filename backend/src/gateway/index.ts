import { oauthRoutes, type OAuthConfig, type OAuthPort } from '@backend/gateway/auth-oauth'
import { authSessionRoutes, type AuthSessionPort } from '@backend/gateway/auth-session'
import { errorBody, fromDomainError } from '@backend/gateway/errors'
import { healthRoutes } from '@backend/gateway/health'
import { likeRoutes, type LikesService } from '@backend/gateway/likes'
import { limitRoutes, type LimitsService } from '@backend/gateway/limits'
import { meRoutes } from '@backend/gateway/me'
import { mediaRoutes, type AvatarReader, type ImageReader } from '@backend/gateway/media'
import { queueRoutes, type QueueReader } from '@backend/gateway/queue'
import { ratingRoutes, type RatingsService } from '@backend/gateway/ratings'
import { recordRoutes, type RecordsService } from '@backend/gateway/records'
import { statsRoutes, type StatsReader } from '@backend/gateway/stats'
import { steamRoutes, type SteamPort } from '@backend/gateway/steam'
import { suggestionRoutes, type SuggestionsService } from '@backend/gateway/suggestions'
import { telegramWebhookRoutes, type TelegramWebhookPort } from '@backend/gateway/telegram'
import { twirRoutes, type TwirService } from '@backend/gateway/twir'
import { userRoutes, type UsersService } from '@backend/gateway/users'
import { weatherRoutes, type WeatherReader } from '@backend/gateway/weather'
import {
  wordleRoutes,
  type WordleNotificationsPort,
  type WordleServicePort,
} from '@backend/gateway/wordle'
import { Elysia } from 'elysia'
import type { Authenticator } from '@backend/gateway/auth'
import type { RateLimiter } from '@backend/gateway/rate-limit'

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
  oauth: OAuthPort
  oauthConfig: OAuthConfig
  images: ImageReader
  avatars: AvatarReader
  steam: SteamPort
  wordle: WordleServicePort
  wordleNotifications: WordleNotificationsPort
  telegramWebhook: TelegramWebhookPort
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
        // `type: 'response'` — это не ошибка клиента, а баг сервера: данные не
        // сошлись со схемой. В сообщении Elysia лежит фрагмент ответа, поэтому
        // наружу отдаём общий 500, а подробности — в лог.
        if ((error as { type?: string }).type === 'response') {
          // Тело ошибки содержит сам ответ (а значит и данные из БД) —
          // наружу и в лог отдаём только место расхождения.
          console.error('[gateway] response schema violation', {
            type: (error as { type?: string }).type,
            path: (error as { valueError?: { path?: string } }).valueError?.path,
          })
          set.status = 500
          return errorBody(500, 'Internal server error')
        }

        set.status = 400
        return errorBody(400, error.message)
      }

      if (code === 'NOT_FOUND') {
        set.status = 404
        return errorBody(404, 'Not Found')
      }

      // Битый JSON — ошибка клиента, а не сервера: Nest отвечал 400.
      if (code === 'PARSE') {
        set.status = 400
        return errorBody(400, 'Malformed request body')
      }

      // Прочие ошибки Elysia с 4xx-статусом (например, INVALID_COOKIE_SIGNATURE)
      // тоже клиентские: не превращаем их в 500.
      const status = (error as { status?: unknown }).status
      if (typeof status === 'number' && status >= 400 && status < 500) {
        set.status = status
        return errorBody(status, error instanceof Error ? error.message : 'Bad Request')
      }

      console.error('[gateway] unhandled error', error)
      set.status = 500
      return errorBody(500, 'Internal server error')
    })
    .use(meRoutes(deps))
    .use(authSessionRoutes(deps))
    .use(oauthRoutes({ ...deps, config: deps.oauthConfig }))
    .use(weatherRoutes(deps))
    .use(statsRoutes(deps))
    .use(queueRoutes(deps))
    .use(likeRoutes(deps))
    .use(recordRoutes(deps))
    .use(ratingRoutes(deps))
    .use(userRoutes(deps))
    .use(suggestionRoutes(deps))
    .use(limitRoutes(deps))
    .use(twirRoutes({ twir: deps.twir, rateLimit: deps.rateLimit, apiKey: deps.twirApiKey }))
    .use(
      telegramWebhookRoutes({ telegramWebhook: deps.telegramWebhook, rateLimit: deps.rateLimit }),
    )
    .use(healthRoutes(deps))
    .use(wordleRoutes(deps))
    .use(mediaRoutes(deps))
    .use(steamRoutes(deps))
}

export type Gateway = ReturnType<typeof createGateway>

/**
 * Тип приложения для Eden. Фронт импортирует его как `import type` — в бандл
 * ничего не попадает, но весь контракт (пути, параметры, тело, ответы)
 * выводится напрямую из роутов.
 */
export type App = ReturnType<typeof createGateway>
