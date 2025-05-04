import { Injectable, OnModuleInit } from '@nestjs/common'
import { env } from '../../utils/enviroments'

export interface WeatherData {
  main: {
    temp: number
    feels_like: number
    humidity: number
  }
  weather: Array<{
    main: string
    description: string
  }>
  wind: {
    speed: number
  }
  name: string
}

@Injectable()
export class WeatherService implements OnModuleInit {
  private cachedData: WeatherData | null = null
  private lastFetch: number = 0
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes in milliseconds

  async onModuleInit() {
    // Initial fetch when service starts
    await this.fetchWeatherData()

    // Set up periodic fetching
    setInterval(() => {
      this.fetchWeatherData()
    }, this.CACHE_DURATION)
  }

  private async fetchWeatherData(): Promise<void> {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${env.WEATHER_LAT}&lon=${env.WEATHER_LON}&appid=${env.WEATHER_API_KEY}&units=metric&lang=ru`,
      )

      if (!response.ok) {
        throw new Error('Weather API request failed')
      }

      this.cachedData = await response.json()
      this.lastFetch = Date.now()
    } catch (error) {
      console.error('Failed to fetch weather data:', error)
    }
  }

  async getWeatherData(): Promise<WeatherData | null> {
    // If cache is expired, fetch new data
    if (Date.now() - this.lastFetch >= this.CACHE_DURATION) {
      await this.fetchWeatherData()
    }
    return this.cachedData
  }
}
