import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { ServiceUnavailableException } from '@nestjs/common'
import { WeatherController } from '../weather.controller'
import type { WeatherDTO } from '../weather.dto'
import type { WeatherService } from '../weather.service'

describe('WeatherController', () => {
  let controller: WeatherController
  let weatherService: { getWeatherData: ReturnType<typeof mock> }

  beforeEach(() => {
    weatherService = { getWeatherData: mock(() => Promise.resolve(null)) }
    controller = new WeatherController(weatherService as unknown as WeatherService)
  })

  it('throws ServiceUnavailableException when the cache is empty', async () => {
    await expect(controller.getWeather()).rejects.toThrow(ServiceUnavailableException)
  })

  it('returns weather data when available', async () => {
    const data = { name: 'Moscow' } as WeatherDTO
    weatherService.getWeatherData = mock(() => Promise.resolve(data))

    await expect(controller.getWeather()).resolves.toBe(data)
  })
})
