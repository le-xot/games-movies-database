import { apiErrorModels, errorBody, publicErrors } from '@backend/gateway/errors'
import { rateLimitGuard, type RateLimiter } from '@backend/gateway/rate-limit'
import { RATE_LIMITS } from '@backend/utils/rate-limits'
import { Elysia, t } from 'elysia'

/**
 * Описание погодного ответа в TypeBox — единственный источник формы на проводе.
 * Имена моделей фиксированы контрактом `$ref`: от них зависят типы фронта.
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

/** Тип ответа собирается из статических типов схем (Ref'ы внутри модели дают unknown). */
export type WeatherResponse = {
  main: typeof weatherModels.WeatherMainDTO.static
  weather: (typeof weatherModels.WeatherConditionDTO.static)[]
  wind: typeof weatherModels.WeatherWindDTO.static
  visibility: number
  clouds: typeof weatherModels.WeatherCloudsDTO.static
  sys: typeof weatherModels.WeatherSysDTO.static
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
  const limit = rateLimitGuard(rateLimit)

  return new Elysia({ name: 'weather' }).model({ ...apiErrorModels, ...weatherModels }).get(
    '/weather',
    async ({ set, request, server, route }) => {
      await limit({ request, server, route }, RATE_LIMITS.public)

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
