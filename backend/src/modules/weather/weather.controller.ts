import { Controller, Get } from '@nestjs/common'
import { ApiResponse, ApiTags } from '@nestjs/swagger'
import { WeatherDTO } from '@/modules/weather/weather.dto'
import { WeatherService } from '@/modules/weather/weather.service'
import { ApiErrors } from '@/utils/api-errors'

@ApiTags('weather')
@ApiErrors()
@Controller('weather')
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  @Get()
  @ApiResponse({ status: 200, description: 'Returns current weather data', type: WeatherDTO })
  async getWeather(): Promise<WeatherDTO | null> {
    return await this.weatherService.getWeatherData()
  }
}
