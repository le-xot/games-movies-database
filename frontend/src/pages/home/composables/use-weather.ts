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
  }
  weather: Array<{
    main: string
  }>
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
  icon: Component
} | null = null

export function useWeather() {
  const city = ref(cached?.city ?? '')
  const temp = ref<number | null>(cached?.temp ?? null)
  const condition = ref(cached?.condition ?? '')
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
      icon.value = weatherIcons[condition.value] ?? Cloud
      cached = {
        city: city.value,
        temp: temp.value,
        condition: condition.value,
        icon: icon.value,
      }
    } catch {
      // silently fail — weather is non-critical
    } finally {
      loading.value = false
    }
  })

  return { city, temp, condition, icon, loading }
}
