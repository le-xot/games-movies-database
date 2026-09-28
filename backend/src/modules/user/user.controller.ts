import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common'
import { ApiResponse, ApiTags } from '@nestjs/swagger'
import { UserRole } from '@/enums'
import { AuthGuard } from '@/modules/auth/auth.guard'
import { RolesGuard } from '@/modules/auth/auth.roles.guard'
import { RateLimit } from '@/modules/rate-limit/rate-limit.decorator'
import { UserAccountEntity } from '@/modules/user/entities/user-account.entity'
import { MergeUsersDto } from '@/modules/user/user.dto'
import { MergeUsersResultEntity, UserEntity } from '@/modules/user/user.entity'
import { UserService } from '@/modules/user/user.service'
import { ApiErrors } from '@/utils/api-errors'
import { RATE_LIMITS } from '@/utils/rate-limits'

@ApiTags('users')
@ApiErrors()
@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Get('users')
  @UseGuards()
  @ApiResponse({ status: 200, type: UserEntity, isArray: true })
  async getAllUsers(): Promise<UserEntity[]> {
    const users = await this.userService.getAllUsers()
    return users.map((user) => ({
      id: user.id,
      login: user.login,
      role: user.role,
      profileImageUrl: user.profileImageUrl,
      color: user.color,
      hasCustomAvatar: user.hasCustomAvatar,
      createdAt: user.createdAt,
    }))
  }

  @Get(':id/accounts')
  @UseGuards(AuthGuard, new RolesGuard([UserRole.ADMIN]))
  @ApiResponse({ status: HttpStatus.OK, type: [UserAccountEntity] })
  async getUserAccounts(@Param('id') id: string): Promise<UserAccountEntity[]> {
    return await this.userService.getLinkedAccounts(id)
  }

  @Get(':id')
  @UseGuards(AuthGuard, new RolesGuard([UserRole.ADMIN]))
  @ApiResponse({ status: HttpStatus.OK, type: UserEntity })
  async getUserById(@Param('id') id: string): Promise<UserEntity> {
    const user = await this.userService.getUserById(id)
    if (!user) {
      throw new NotFoundException(`User ${id} not found`)
    }
    return user
  }

  @Delete(':id')
  @RateLimit(RATE_LIMITS.write)
  @UseGuards(AuthGuard, new RolesGuard([UserRole.ADMIN]))
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  async deleteUser(@Param('id') id: string): Promise<void> {
    await this.userService.deleteUserById(id)
  }

  @Post(':id/merge')
  @RateLimit(RATE_LIMITS.write)
  @UseGuards(AuthGuard, new RolesGuard([UserRole.ADMIN]))
  @ApiResponse({ status: HttpStatus.CREATED, type: MergeUsersResultEntity })
  async mergeUsers(
    @Param('id') id: string,
    @Body() dto: MergeUsersDto,
  ): Promise<MergeUsersResultEntity> {
    return await this.userService.mergeUsers(id, dto.sourceUserId)
  }
}
