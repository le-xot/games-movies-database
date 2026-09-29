import { Controller, Get } from '@nestjs/common'
import { ApiResponse } from '@nestjs/swagger'
import { HealthResponseDTO } from '@/app.dto'
import { ApiErrors } from '@/utils/api-errors'

@ApiErrors({ includeAuth: false })
@Controller()
export class AppController {
  @Get('/health')
  @ApiResponse({ status: 200, type: HealthResponseDTO })
  health(): HealthResponseDTO {
    return { status: 'ok' }
  }
}
