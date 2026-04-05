import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common'
import { ApiResponse, ApiTags } from '@nestjs/swagger'
import { Throttle } from '@nestjs/throttler'
import { UserRole } from '@/enums'
import { AuthGuard } from '@/modules/auth/auth.guard'
import { RolesGuard } from '@/modules/auth/auth.roles.guard'
import { User } from '@/modules/auth/auth.user.decorator'
import { GetLikesByIdDTO, GetLikesDTO, LikeCreateDTO } from '@/modules/like/like.dto'
import { LikeEntity } from '@/modules/like/like.entity'
import { LikeService } from '@/modules/like/like.service'
import { UserEntity } from '@/modules/user/user.entity'

@ApiTags('likes')
@Controller('likes')
export class LikeController {
  constructor(private likeService: LikeService) {}

  @Post()
  @Throttle({ default: { ttl: 60000, limit: 30 } })
  @UseGuards(AuthGuard, new RolesGuard([UserRole.USER, UserRole.ADMIN]))
  @ApiResponse({ type: LikeEntity, status: 200, description: 'Returns created like' })
  async createLike(@Body() data: LikeCreateDTO, @User() user: UserEntity): Promise<LikeEntity> {
    return await this.likeService.createLike(user.id, data.recordId)
  }

  @Delete(':id')
  @Throttle({ default: { ttl: 60000, limit: 30 } })
  @UseGuards(AuthGuard, new RolesGuard([UserRole.USER, UserRole.ADMIN]))
  @ApiResponse({ status: 200, description: 'Like deleted successfully' })
  async deleteLike(@Param('id') id: number, @User() user: UserEntity): Promise<void> {
    await this.likeService.deleteLike(user.id, id)
  }

  @Get('records/:id')
  @UseGuards(AuthGuard, new RolesGuard([UserRole.USER, UserRole.ADMIN]))
  @ApiResponse({ type: GetLikesByIdDTO, status: 200, description: 'Returns likes by record id' })
  async getLikesByRecordId(@Param('id') id: number): Promise<GetLikesByIdDTO> {
    return await this.likeService.getLikesByRecordId(id)
  }

  @Get('users/:id')
  @UseGuards(AuthGuard, new RolesGuard([UserRole.USER, UserRole.ADMIN]))
  @ApiResponse({ type: GetLikesByIdDTO, status: 200, description: 'Returns likes by user id' })
  async getLikesByUserId(@Param('id') id: string): Promise<GetLikesByIdDTO> {
    return await this.likeService.getLikesByUserId(id)
  }

  @Get('count')
  @UseGuards(AuthGuard, new RolesGuard([UserRole.USER, UserRole.ADMIN]))
  @ApiResponse({ type: GetLikesByIdDTO, status: 200, description: 'Returns likes count' })
  async getLikes(@Query() query: GetLikesDTO): Promise<GetLikesByIdDTO> {
    const { page, limit } = query
    return await this.likeService.getLikes(page, limit)
  }
}
