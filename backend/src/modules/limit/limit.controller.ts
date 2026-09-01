import { Body, Controller, Post, UseGuards } from '@nestjs/common'
import { ApiResponse, ApiTags } from '@nestjs/swagger'
import { UserRole } from '@/enums'
import { AuthGuard } from '@/modules/auth/auth.guard'
import { RolesGuard } from '@/modules/auth/auth.roles.guard'
import { ChangeLimitDTO, LimitEntity } from '@/modules/limit/limit.dto'
import { LimitService } from '@/modules/limit/limit.service'
import { RateLimit } from '@/modules/rate-limit/rate-limit.decorator'
import { RATE_LIMITS } from '@/utils/rate-limits'

@ApiTags('limits')
@Controller('limits')
export class LimitController {
  constructor(private limitService: LimitService) {}

  @Post()
  @RateLimit(RATE_LIMITS.write)
  @UseGuards(AuthGuard, new RolesGuard([UserRole.ADMIN]))
  @ApiResponse({
    status: 200,
    description: 'Returns updated limit',
    type: LimitEntity,
  })
  async changeLimit(@Body() limitData: ChangeLimitDTO): Promise<LimitEntity> {
    return await this.limitService.changeLimit(limitData)
  }
}
