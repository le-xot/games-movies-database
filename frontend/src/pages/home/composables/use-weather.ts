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
import { useQuery } from '@pinia/colada'
import { computed, type Component } from 'vue'
import { WEATHER_QUERY_KEY } from '@/composables/query-keys'
import { unwrap } from '@/lib/api'
import { useApi } from '@/stores/use-api'
import { UFA_TIME_ZONE } from '@/utils/time'

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

/** Погода обновляется раз в 10 минут; кэш и дедупликацию держит colada. */
const WEATHER_STALE_TIME_MS = 10 * 60 * 1000

const formatTime = (unixSeconds: number) =>
  new Date(unixSeconds * 1000).toLocaleTimeString('ru-RU', {
    timeZone: UFA_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
  })

/**
 * Погода для виджета: один colada-запрос (кэш, дедупликация, инвалидация) и
 * презентационное отображение в computed. Ручной модульный кэш удалён.
 */
export function useWeather() {
  const api = useApi()

  const { data, isLoading } = useQuery({
    key: [WEATHER_QUERY_KEY],
    staleTime: WEATHER_STALE_TIME_MS,
    // Кэш должен жить не меньше TTL: иначе дефолтные 5 минут вытесняют данные
    // раньше, чем они устареют, и виджет мигает пустым при ремоунте.
    gcTime: WEATHER_STALE_TIME_MS,
    query: () => unwrap(api.weather.get()),
  })

  const view = computed(() => {
    const raw = data.value
    if (!raw) return null

    const condition = raw.weather[0]?.main ?? ''

    return {
      city: raw.name,
      temp: Math.round(raw.main.temp),
      condition,
      description: raw.weather[0]?.description ?? '',
      feelsLike: Math.round(raw.main.feels_like),
      humidity: raw.main.humidity,
      windSpeed: Math.round(raw.wind.speed),
      pressure: Math.round(raw.main.pressure * 0.750062),
      visibility: Math.round(raw.visibility / 1000),
      clouds: raw.clouds.all,
      sunrise: formatTime(raw.sys.sunrise),
      sunset: formatTime(raw.sys.sunset),
      icon: weatherIcons[condition] ?? Cloud,
    }
  })

  return {
    city: computed(() => view.value?.city ?? ''),
    temp: computed(() => view.value?.temp ?? null),
    description: computed(() => view.value?.description ?? ''),
    feelsLike: computed(() => view.value?.feelsLike ?? null),
    humidity: computed(() => view.value?.humidity ?? null),
    windSpeed: computed(() => view.value?.windSpeed ?? null),
    pressure: computed(() => view.value?.pressure ?? null),
    visibility: computed(() => view.value?.visibility ?? null),
    clouds: computed(() => view.value?.clouds ?? null),
    sunrise: computed(() => view.value?.sunrise ?? ''),
    sunset: computed(() => view.value?.sunset ?? ''),
    icon: computed(() => view.value?.icon ?? Cloud),
    loading: computed(() => isLoading.value && !view.value),
  }
}
