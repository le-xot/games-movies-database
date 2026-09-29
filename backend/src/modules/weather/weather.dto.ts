import { ApiProperty } from '@nestjs/swagger'

export class WeatherMainDTO {
  @ApiProperty()
  temp!: number

  @ApiProperty()
  feels_like!: number

  @ApiProperty()
  humidity!: number

  @ApiProperty()
  pressure!: number
}

export class WeatherConditionDTO {
  @ApiProperty()
  main!: string

  @ApiProperty()
  description!: string
}

export class WeatherWindDTO {
  @ApiProperty()
  speed!: number
}

export class WeatherCloudsDTO {
  @ApiProperty()
  all!: number
}

export class WeatherSysDTO {
  @ApiProperty()
  sunrise!: number

  @ApiProperty()
  sunset!: number
}

export class WeatherDTO {
  @ApiProperty({ type: WeatherMainDTO })
  main!: WeatherMainDTO

  @ApiProperty({ type: [WeatherConditionDTO] })
  weather!: WeatherConditionDTO[]

  @ApiProperty({ type: WeatherWindDTO })
  wind!: WeatherWindDTO

  @ApiProperty()
  visibility!: number

  @ApiProperty({ type: WeatherCloudsDTO })
  clouds!: WeatherCloudsDTO

  @ApiProperty({ type: WeatherSysDTO })
  sys!: WeatherSysDTO

  @ApiProperty()
  name!: string
}
