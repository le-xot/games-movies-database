import { env } from "@/utils/enviroments"
import { Injectable, type OnModuleInit } from "@nestjs/common"

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
  private readonly CACHE_DURATION = 5 * 60 * 1000

  onModuleInit() {
    this.fetchWeatherData()
      .then(() => {
        setInterval(() => {
          this.fetchWeatherData()
        }, this.CACHE_DURATION)
      })
      .catch((e) => {
        throw new Error(`Failed to initialize WeatherService: ${e.message}`)
      })
  }

  private async fetchWeatherData(): Promise<void> {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${env.WEATHER_LAT}&lon=${env.WEATHER_LON}&appid=${env.WEATHER_API_KEY}&units=metric&lang=ru`,
      )

      if (!response.ok) {
        throw new Error("Weather API request failed")
      }

      this.cachedData = await response.json()
      this.lastFetch = Date.now()
    } catch (error) {
      console.error("Failed to fetch weather data:", error)
    }
  }

  async getWeatherData(): Promise<WeatherData | null> {
    if (Date.now() - this.lastFetch >= this.CACHE_DURATION) {
      await this.fetchWeatherData()
    }
    return this.cachedData
  }
}
