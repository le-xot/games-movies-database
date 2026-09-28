import { Injectable, Logger, type OnModuleInit } from '@nestjs/common'
import { env } from '@/utils/enviroments'
import type { WeatherDTO } from '@/modules/weather/weather.dto'

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

      this.cachedData = (await response.json()) as WeatherDTO
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
