import { Controller, Get } from "@nestjs/common"
import { ApiResponse, ApiTags } from "@nestjs/swagger"
import { WeatherService } from "./weather.service"

@ApiTags("weather")
@Controller("weather")
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  @Get()
  @ApiResponse({ status: 200, description: "Returns current weather data" })
  async getWeather() {
    return await this.weatherService.getWeatherData()
  }
}
