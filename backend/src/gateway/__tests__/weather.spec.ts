import { describe, expect, it } from 'bun:test'
import { createTestGateway } from '@/__tests__/helpers/gateway-stub'

const WEATHER = {
  main: { temp: 12.5, feels_like: 10.1, humidity: 60, pressure: 1012 },
  weather: [{ main: 'Clouds', description: 'облачно' }],
  wind: { speed: 3.2 },
  visibility: 10_000,
  clouds: { all: 75 },
  sys: { sunrise: 1, sunset: 2 },
  name: 'Москва',
}

async function getWeather(data: typeof WEATHER | null) {
  const app = createTestGateway({
    weather: { getWeatherData: async () => data },
  })

  const response = await app.handle(new Request('http://localhost/weather'))

  return { status: response.status, body: await response.json() }
}

describe('GET /weather', () => {
  it('returns the current weather', async () => {
    const { status, body } = await getWeather(WEATHER)

    expect(status).toBe(200)
    expect(body).toEqual(WEATHER)
  })

  it('returns 503 with the error envelope when data is not available', async () => {
    const { status, body } = await getWeather(null)

    expect(status).toBe(503)
    expect(body).toEqual({
      statusCode: 503,
      message: 'Weather data is not available yet',
    })
  })
})
