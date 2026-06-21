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

export function useWeather() {
  const city = ref<string>('')
  const temp = ref<number | null>(null)
  const condition = ref<string>('')
  const icon = ref<Component>(Cloud)
  const loading = ref(true)

  onMounted(async () => {
    try {
      const response = await fetch('/api/weather')
      if (!response.ok) return
      const data: WeatherResponse = await response.json()
      city.value = data.name
      temp.value = Math.round(data.main.temp)
      condition.value = data.weather[0]?.main ?? ''
      icon.value = weatherIcons[condition.value] ?? Cloud
    } catch {
      // silently fail — weather is non-critical
    } finally {
      loading.value = false
    }
  })

  return { city, temp, condition, icon, loading }
}
