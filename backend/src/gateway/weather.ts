import { apiErrorModels, errorBody, publicErrors } from '@backend/gateway/errors'
import { enforceRateLimit, type RateLimiter } from '@backend/gateway/rate-limit'
import { RATE_LIMITS } from '@backend/utils/rate-limits'
import { Elysia, t } from 'elysia'

/**
 * Описание погодного ответа в TypeBox. Имена моделей повторяют DTO из
 * `modules/weather/weather.dto.ts`: от них зависит `$ref` в контракте, а значит
 * и имена схем в сгенерированных типах фронта.
 */
export const weatherModels = {
  WeatherMainDTO: t.Object({
    temp: t.Number(),
    feels_like: t.Number(),
    humidity: t.Number(),
    pressure: t.Number(),
  }),
  WeatherConditionDTO: t.Object({
    main: t.String(),
    description: t.String(),
  }),
  WeatherWindDTO: t.Object({
    speed: t.Number(),
  }),
  WeatherCloudsDTO: t.Object({
    all: t.Number(),
  }),
  WeatherSysDTO: t.Object({
    sunrise: t.Number(),
    sunset: t.Number(),
  }),
  WeatherDTO: t.Object({
    main: t.Ref('WeatherMainDTO'),
    weather: t.Array(t.Ref('WeatherConditionDTO')),
    wind: t.Ref('WeatherWindDTO'),
    visibility: t.Number(),
    clouds: t.Ref('WeatherCloudsDTO'),
    sys: t.Ref('WeatherSysDTO'),
    name: t.String(),
  }),
}

export interface WeatherResponse {
  main: { temp: number; feels_like: number; humidity: number; pressure: number }
  weather: { main: string; description: string }[]
  wind: { speed: number }
  visibility: number
  clouds: { all: number }
  sys: { sunrise: number; sunset: number }
  name: string
}

/** Что гейтвею нужно от доменного слоя. Ни Nest, ни HTTP здесь нет. */
export interface WeatherReader {
  getWeatherData(): Promise<WeatherResponse | null>
}

export interface WeatherRouteDeps {
  weather: WeatherReader
  rateLimit: RateLimiter
}

export function weatherRoutes({ weather, rateLimit }: WeatherRouteDeps) {
  return new Elysia({ name: 'weather' }).model({ ...apiErrorModels, ...weatherModels }).get(
    '/weather',
    async ({ set, request, server }) => {
      await enforceRateLimit(rateLimit, {
        request,
        route: 'WeatherController.getWeather',
        config: RATE_LIMITS.public,
        ip: server?.requestIP(request)?.address,
      })

      const data = await weather.getWeatherData()

      if (!data) {
        set.status = 503
        return errorBody(503, 'Weather data is not available yet')
      }

      return data
    },
    {
      response: {
        200: 'WeatherDTO' as const,
        503: 'ApiErrorDto' as const,
        ...publicErrors(),
      },
    },
  )
}
