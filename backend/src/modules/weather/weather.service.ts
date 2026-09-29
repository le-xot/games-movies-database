import { Injectable, Logger, type OnModuleInit } from '@nestjs/common'
import { env } from '@/utils/enviroments'
import { isRecord } from '@/utils/type-guards'
import type { WeatherDTO } from '@/modules/weather/weather.dto'

function isWeatherData(value: unknown): value is WeatherDTO {
  if (!isRecord(value)) return false
  const main = value.main
  const wind = value.wind
  const clouds = value.clouds
  const sys = value.sys
  const weather = value.weather
  const condition = Array.isArray(weather) && isRecord(weather[0]) ? weather[0] : null

  return (
    typeof value.name === 'string' &&
    typeof value.visibility === 'number' &&
    isRecord(main) &&
    typeof main.temp === 'number' &&
    typeof main.feels_like === 'number' &&
    typeof main.humidity === 'number' &&
    typeof main.pressure === 'number' &&
    condition !== null &&
    typeof condition.main === 'string' &&
    typeof condition.description === 'string' &&
    isRecord(wind) &&
    typeof wind.speed === 'number' &&
    isRecord(clouds) &&
    typeof clouds.all === 'number' &&
    isRecord(sys) &&
    typeof sys.sunrise === 'number' &&
    typeof sys.sunset === 'number'
  )
}

@Injectable()
export class WeatherService implements OnModuleInit {
  private readonly logger = new Logger(WeatherService.name)
  private cachedData: WeatherDTO | null = null
  private lastFetch: number = 0
  private readonly CACHE_DURATION = 5 * 60 * 1000

  async onModuleInit() {
    this.logger.log('Initializing WeatherService and fetching initial data')
    try {
      await this.fetchWeatherData()
      this.logger.log('Initial weather data fetched successfully')
      setInterval(() => {
        this.fetchWeatherData().catch((e) => {
          this.logger.error(`Failed to fetch weather data: ${e.message}`, e.stack)
        })
      }, this.CACHE_DURATION)
    } catch (e) {
      this.logger.error(
        `Failed to initialize WeatherService: ${(e as Error).message}`,
        (e as Error).stack,
      )
      throw new Error(`Failed to initialize WeatherService: ${(e as Error).message}`, { cause: e })
    }
  }

  private async fetchWeatherData(): Promise<void> {
    try {
      this.logger.log('Fetching weather data from OpenWeatherMap')
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${env.WEATHER_LAT}&lon=${env.WEATHER_LON}&appid=${env.WEATHER_API_KEY}&units=metric&lang=ru`,
      )

      if (!response.ok) {
        throw new Error('Weather API request failed')
      }

      const data: unknown = await response.json()
      if (!isWeatherData(data)) {
        throw new Error('Unexpected weather API response')
      }
      this.cachedData = data
      this.lastFetch = Date.now()
      this.logger.log('Weather data updated')
    } catch (error) {
      this.logger.error('Failed to fetch weather data:', error)
    }
  }

  async getWeatherData(): Promise<WeatherDTO | null> {
    if (Date.now() - this.lastFetch >= this.CACHE_DURATION) {
      await this.fetchWeatherData()
    }
    return this.cachedData
  }
}
