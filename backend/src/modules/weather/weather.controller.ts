import { Controller, Get, ServiceUnavailableException } from '@nestjs/common'
import { ApiResponse, ApiTags } from '@nestjs/swagger'
import { WeatherDTO } from '@/modules/weather/weather.dto'
import { WeatherService } from '@/modules/weather/weather.service'
import { ApiErrorDto, ApiErrors } from '@/utils/api-errors'

@ApiTags('weather')
@ApiErrors()
@Controller('weather')
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  @Get()
  @ApiResponse({ status: 200, description: 'Returns current weather data', type: WeatherDTO })
  @ApiResponse({
    status: 503,
    description: 'Weather data is not available yet',
    type: ApiErrorDto,
  })
  async getWeather(): Promise<WeatherDTO> {
    const data = await this.weatherService.getWeatherData()
    if (!data) {
      throw new ServiceUnavailableException('Weather data is not available yet')
    }
    return data
  }
}
