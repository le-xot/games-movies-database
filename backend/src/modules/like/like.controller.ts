import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common'
import { ApiResponse, ApiTags } from '@nestjs/swagger'
import { $Enums } from '@prisma/client'
import { AuthGuard } from '../auth/auth.guard'
import { RolesGuard } from '../auth/auth.roles.guard'
import { User } from '../auth/auth.user.decorator'
import { UserEntity } from '../user/user.entity'
import { GetLikesByIdDTO, LikeCreateDTO } from './like.dto'
import { LikeEntity } from './like.entity'
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

  @Get('records/:id')
  @UseGuards(AuthGuard, new RolesGuard([$Enums.UserRole.USER, $Enums.UserRole.ADMIN]))
  @ApiResponse({ status: 200, description: 'Returns likes by record id' })
  async getLikesByRecordId(@Param('id') id: number): Promise<GetLikesByIdDTO> {
    console.log('getLikesByRecordId', typeof id, id)
    return await this.likeService.getLikesByRecordId(id)
  }

  @Get('users/:id')
  @UseGuards(AuthGuard, new RolesGuard([$Enums.UserRole.USER, $Enums.UserRole.ADMIN]))
  @ApiResponse({ status: 200, description: 'Returns likes by user id' })
  async getLikesByUserId(@Param('id') id: string): Promise<GetLikesByIdDTO> {
    console.log('getLikesByUserId', typeof id, id)
    return await this.likeService.getLikesByUserId(id)
  }

  @Get('count')
  @UseGuards(AuthGuard, new RolesGuard([$Enums.UserRole.USER, $Enums.UserRole.ADMIN]))
  @ApiResponse({ status: 200, description: 'Returns likes count' })
  async getLikes(): Promise<GetLikesByIdDTO> {
    return await this.likeService.getLikes()
  }
}
