import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common'
import { ApiResponse, ApiTags } from '@nestjs/swagger'
import { $Enums } from '@prisma/client'
import { AuthGuard } from '../auth/auth.guard'
import { RolesGuard } from '../auth/auth.roles.guard'
import { User } from '../auth/auth.user.decorator'
import { UserEntity } from '../user/user.entity'
import { LikeCreateDTO } from './like.dto'
import { LikeEntity } from './like.entuty'
import { LikeService } from './like.service'

@ApiTags('likes')
@Controller('likes')
export class LikeController {
  constructor(private likeService: LikeService) {}

  @Post()
  @UseGuards(AuthGuard, new RolesGuard([$Enums.UserRole.USER, $Enums.UserRole.ADMIN]))
  @ApiResponse({ status: 200, description: 'Returns created like' })
  async createLike(@Body() data: LikeCreateDTO, @User() user: UserEntity): Promise<LikeEntity> {
    return await this.likeService.createLike(user.id, data.recordId)
  }

  @Delete(':id')
  @UseGuards(AuthGuard, new RolesGuard([$Enums.UserRole.USER, $Enums.UserRole.ADMIN]))
  @ApiResponse({ status: 200, description: 'Like deleted successfully' })
  async deleteLike(@Param('id') id: number, @User() user: UserEntity): Promise<void> {
    await this.likeService.deleteLike(user.id, id, user.role)
  }

  @Get('record/:id')
  @UseGuards(AuthGuard, new RolesGuard([$Enums.UserRole.USER, $Enums.UserRole.ADMIN]))
  @ApiResponse({ status: 200, description: 'Returns likes by record id' })
  async getLikesByRecordId(@Param('id') id: number): Promise<LikeEntity[]> {
    return await this.likeService.getLikesByRecordId(id)
  }

  @Get('user/:id')
  @UseGuards(AuthGuard, new RolesGuard([$Enums.UserRole.USER, $Enums.UserRole.ADMIN]))
  @ApiResponse({ status: 200, description: 'Returns likes by user id' })
  async getLikesByUserId(@Param('id') id: string): Promise<LikeEntity[]> {
    return await this.likeService.getLikesByUserId(id)
  }

  @Get('record/:id/count')
  @UseGuards(AuthGuard, new RolesGuard([$Enums.UserRole.USER, $Enums.UserRole.ADMIN]))
  @ApiResponse({ status: 200, description: 'Returns likes count by record id' })
  async getLikesCountByRecordId(@Param('id') id: number): Promise<number> {
    return await this.likeService.getLikesCountByRecordId(id)
  }

  @Get('user/:id/count')
  @UseGuards(AuthGuard, new RolesGuard([$Enums.UserRole.USER, $Enums.UserRole.ADMIN]))
  @ApiResponse({ status: 200, description: 'Returns likes count by user id' })
  async getLikesCountByUserId(@Param('id') id: string): Promise<number> {
    return await this.likeService.getLikesCountByUserId(id)
  }

  @Get('count')
  @UseGuards(AuthGuard, new RolesGuard([$Enums.UserRole.USER, $Enums.UserRole.ADMIN]))
  @ApiResponse({ status: 200, description: 'Returns likes count' })
  async getLikesCount(): Promise<number> {
    return await this.likeService.getLikesCount()
  }
}
