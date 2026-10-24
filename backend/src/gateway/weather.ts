import { Elysia, t } from 'elysia'
import { apiErrorModels, standardErrors } from '@/gateway/errors'

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

export type WeatherResponse = typeof weatherModels.WeatherDTO.static

/** Что гейтвею нужно от доменного слоя. Ни Nest, ни HTTP здесь нет. */
export interface WeatherReader {
  getWeatherData(): Promise<WeatherResponse | null>
}

export function weatherRoutes(weather: WeatherReader) {
  return new Elysia({ name: 'weather' }).model({ ...apiErrorModels, ...weatherModels }).get(
    '/weather',
    async ({ set }) => {
      const data = await weather.getWeatherData()

      if (!data) {
        set.status = 503
        return { statusCode: 503, message: 'Weather data is not available yet' }
      }

      return data
    },
    {
      response: {
        200: 'WeatherDTO' as const,
        503: 'ApiErrorDto' as const,
        ...standardErrors({ auth: false }),
      },
    },
  )
}
