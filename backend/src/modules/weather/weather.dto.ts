export class WeatherMainDTO {
  temp!: number

  feels_like!: number

  humidity!: number

  pressure!: number
}

export class WeatherConditionDTO {
  main!: string

  description!: string
}

export class WeatherWindDTO {
  speed!: number
}

export class WeatherCloudsDTO {
  all!: number
}

export class WeatherSysDTO {
  sunrise!: number

  sunset!: number
}

export class WeatherDTO {
  main!: WeatherMainDTO

  weather!: WeatherConditionDTO[]

  wind!: WeatherWindDTO

  visibility!: number

  clouds!: WeatherCloudsDTO

  sys!: WeatherSysDTO

  name!: string
}
