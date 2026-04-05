import { Module } from '@nestjs/common'
import { WeatherController } from '@/modules/weather/weather.controller'
import { WeatherService } from '@/modules/weather/weather.service'

@Module({
  controllers: [WeatherController],
  providers: [WeatherService],
})
export class WeatherModule {}
