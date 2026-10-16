import { Body, Controller, Delete, Get, Param, Put, Query, UseGuards } from '@nestjs/common'
import { ApiResponse, ApiTags } from '@nestjs/swagger'
import { UserRole } from '@/enums'
import { AuthGuard } from '@/modules/auth/auth.guard'
import { OptionalAuthGuard } from '@/modules/auth/auth.optional.guard'
import { RolesGuard } from '@/modules/auth/auth.roles.guard'
import { User } from '@/modules/auth/auth.user.decorator'
import { RateLimit } from '@/modules/rate-limit/rate-limit.decorator'
import { GetUserRatingsQueryDTO, RatingUpsertDTO } from '@/modules/rating/rating.dto'
import {
  FriendsMemberEntity,
  GetFriendsEntity,
  GetUserRatingsEntity,
  RatingEntity,
} from '@/modules/rating/rating.entity'
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
  @UseGuards(AuthGuard, new RolesGuard([UserRole.USER]))
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
  @UseGuards(AuthGuard, new RolesGuard([UserRole.USER]))
  @ApiResponse({ status: 200, description: 'Rating deleted successfully' })
  async unrate(@Param('recordId') recordId: number, @User() user: UserEntity): Promise<void> {
    await this.ratingService.unrate(user.id, recordId)
  }

  @Get('my')
  @UseGuards(AuthGuard, new RolesGuard([UserRole.USER, UserRole.ADMIN]))
  @ApiResponse({ type: GetUserRatingsEntity, status: 200 })
  async getMyRatings(
    @Query() query: GetUserRatingsQueryDTO,
    @User() user: UserEntity,
  ): Promise<GetUserRatingsEntity> {
    const { items, total } = await this.ratingService.getUserRatings(
      user.id,
      user.id,
      query.page ?? 1,
      query.limit ?? 10,
      query.grade,
    )
    return new GetUserRatingsEntity({ items, total })
  }

  @Get('users/:id')
  @UseGuards(OptionalAuthGuard)
  @ApiResponse({ type: GetUserRatingsEntity, status: 200 })
  async getUserRatings(
    @Param('id') id: string,
    @Query() query: GetUserRatingsQueryDTO,
    @User() viewer?: UserEntity,
  ): Promise<GetUserRatingsEntity> {
    const { items, total } = await this.ratingService.getUserRatings(
      viewer?.id,
      id,
      query.page ?? 1,
      query.limit ?? 10,
      query.grade,
    )
    return new GetUserRatingsEntity({ items, total })
  }

  @Get('friends')
  @ApiResponse({ type: GetFriendsEntity, status: 200 })
  async getFriends(): Promise<GetFriendsEntity> {
    const members = await this.ratingService.getFriends()
    return new GetFriendsEntity({
      members: members.map((member) => new FriendsMemberEntity(member)),
    })
  }
}
