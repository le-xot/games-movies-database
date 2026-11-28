/**
 * Погодный снимок домена. Форма — как у ответа OpenWeatherMap (один источник
 * для type guard и сервиса), но без class-DTO: инстансов этих типов не бывает.
 */
export interface WeatherMain {
  temp: number
  feels_like: number
  humidity: number
  pressure: number
}

export interface WeatherCondition {
  main: string
  description: string
}

export interface WeatherWind {
  speed: number
}

export interface WeatherClouds {
  all: number
}

export interface WeatherSys {
  sunrise: number
  sunset: number
}

export interface WeatherSnapshot {
  main: WeatherMain
  weather: WeatherCondition[]
  wind: WeatherWind
  visibility: number
  clouds: WeatherClouds
  sys: WeatherSys
  name: string
}
