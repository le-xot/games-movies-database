import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  Snowflake,
  Sun,
  Wind,
} from '@lucide/vue'
import { type Component, onMounted, ref } from 'vue'

interface WeatherResponse {
  name: string
  main: {
    temp: number
    feels_like: number
    humidity: number
    pressure: number
  }
  weather: Array<{
    main: string
    description: string
  }>
  wind: {
    speed: number
  }
  visibility: number
  clouds: {
    all: number
  }
  sys: {
    sunrise: number
    sunset: number
  }
}

const weatherIcons: Record<string, Component> = {
  Clear: Sun,
  Clouds: Cloud,
  Rain: CloudRain,
  Drizzle: CloudDrizzle,
  Thunderstorm: CloudLightning,
  Snow: Snowflake,
  Mist: CloudFog,
  Smoke: CloudFog,
  Haze: CloudFog,
  Fog: CloudFog,
  Dust: Wind,
  Sand: Wind,
  Ash: CloudFog,
  Squall: Wind,
  Tornado: Wind,
}

let cached: {
  city: string
  temp: number
  condition: string
  description: string
  feelsLike: number
  humidity: number
  windSpeed: number
  pressure: number
  visibility: number
  clouds: number
  sunrise: string
  sunset: string
  icon: Component
} | null = null

export function useWeather() {
  const city = ref(cached?.city ?? '')
  const temp = ref<number | null>(cached?.temp ?? null)
  const condition = ref(cached?.condition ?? '')
  const description = ref(cached?.description ?? '')
  const feelsLike = ref<number | null>(cached?.feelsLike ?? null)
  const humidity = ref<number | null>(cached?.humidity ?? null)
  const windSpeed = ref<number | null>(cached?.windSpeed ?? null)
  const pressure = ref<number | null>(cached?.pressure ?? null)
  const visibility = ref<number | null>(cached?.visibility ?? null)
  const clouds = ref<number | null>(cached?.clouds ?? null)
  const sunrise = ref(cached?.sunrise ?? '')
  const sunset = ref(cached?.sunset ?? '')
  const icon = ref<Component>(cached?.icon ?? Cloud)
  const loading = ref(!cached)

  onMounted(async () => {
    if (cached) return

    try {
      const response = await fetch('/api/weather')
      if (!response.ok) return
      const data: WeatherResponse = await response.json()
      city.value = data.name
      temp.value = Math.round(data.main.temp)
      condition.value = data.weather[0]?.main ?? ''
      description.value = data.weather[0]?.description ?? ''
      feelsLike.value = Math.round(data.main.feels_like)
      humidity.value = data.main.humidity
      windSpeed.value = Math.round(data.wind.speed)
      pressure.value = Math.round(data.main.pressure * 0.750062)
      visibility.value = Math.round(data.visibility / 1000)
      clouds.value = data.clouds.all
      sunrise.value = new Date(data.sys.sunrise * 1000).toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
      })
      sunset.value = new Date(data.sys.sunset * 1000).toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
      })
      icon.value = weatherIcons[condition.value] ?? Cloud
      cached = {
        city: city.value,
        temp: temp.value,
        condition: condition.value,
        description: description.value,
        feelsLike: feelsLike.value,
        humidity: humidity.value,
        windSpeed: windSpeed.value,
        pressure: pressure.value,
        visibility: visibility.value,
        clouds: clouds.value,
        sunrise: sunrise.value,
        sunset: sunset.value,
        icon: icon.value,
      }
    } catch {
      // silently fail — weather is non-critical
    } finally {
      loading.value = false
    }
  })

  return {
    city,
    temp,
    condition,
    description,
    feelsLike,
    humidity,
    windSpeed,
    pressure,
    visibility,
    clouds,
    sunrise,
    sunset,
    icon,
    loading,
  }
}
