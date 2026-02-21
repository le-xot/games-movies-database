import { Controller, Get, Logger } from '@nestjs/common'
import { ApiResponse, ApiTags } from '@nestjs/swagger'
import { WeatherService } from './weather.service'

@ApiTags('weather')
@Controller('weather')
export class WeatherController {
  private readonly logger = new Logger(WeatherController.name)
  constructor(private readonly weatherService: WeatherService) {}

  @Get()
  @ApiResponse({ status: 200, description: 'Returns current weather data' })
  async getWeather() {
    this.logger.log('getWeather called')
    return await this.weatherService.getWeatherData()
  }
}
