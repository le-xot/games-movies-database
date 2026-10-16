import { Body, Controller, Delete, Param, Put, UseGuards } from '@nestjs/common'
import { ApiResponse, ApiTags } from '@nestjs/swagger'
import { UserRole } from '@/enums'
import { AuthGuard } from '@/modules/auth/auth.guard'
import { RolesGuard } from '@/modules/auth/auth.roles.guard'
import { User } from '@/modules/auth/auth.user.decorator'
import { RateLimit } from '@/modules/rate-limit/rate-limit.decorator'
import { RatingUpsertDTO } from '@/modules/rating/rating.dto'
import { RatingEntity } from '@/modules/rating/rating.entity'
import { RatingService } from '@/modules/rating/rating.service'
import { UserEntity } from '@/modules/user/user.entity'
import { ApiErrors } from '@/utils/api-errors'
import { RATE_LIMITS } from '@/utils/rate-limits'

@ApiTags('ratings')
@ApiErrors()
@Controller('ratings')
export class RatingController {
  constructor(private ratingService: RatingService) {}

  @Put(':recordId')
  @RateLimit(RATE_LIMITS.like)
  @UseGuards(AuthGuard, new RolesGuard([UserRole.USER, UserRole.ADMIN]))
  @ApiResponse({
    type: RatingEntity,
    status: 200,
    description: 'Returns created or updated rating',
  })
  async rate(
    @Param('recordId') recordId: number,
    @Body() data: RatingUpsertDTO,
    @User() user: UserEntity,
  ): Promise<RatingEntity> {
    return await this.ratingService.rate(user.id, recordId, data.grade)
  }

  @Delete(':recordId')
  @RateLimit(RATE_LIMITS.like)
  @UseGuards(AuthGuard, new RolesGuard([UserRole.USER, UserRole.ADMIN]))
  @ApiResponse({ status: 200, description: 'Rating deleted successfully' })
  async unrate(@Param('recordId') recordId: number, @User() user: UserEntity): Promise<void> {
    await this.ratingService.unrate(user.id, recordId)
  }
}
