import { Controller, Delete, Get, HttpStatus, Param, UseGuards } from '@nestjs/common'
import { ApiResponse, ApiTags } from '@nestjs/swagger'
import { Throttle } from '@nestjs/throttler'
import { UserRole } from '@/enums'
import { AuthGuard } from '@/modules/auth/auth.guard'
import { RolesGuard } from '@/modules/auth/auth.roles.guard'
import { UserEntity } from '@/modules/user/user.entity'
import { UserService } from '@/modules/user/user.service'
import { THROTTLER_LIMITS } from '@/utils/throttler'

@ApiTags('users')
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
      createdAt: user.createdAt,
    }))
  }

  @Get(':id')
  @UseGuards(AuthGuard, new RolesGuard([UserRole.ADMIN]))
  @ApiResponse({ status: HttpStatus.OK })
  async getUserById(@Param('id') id: string) {
    return await this.userService.getUserById(id)
  }

  @Get(':login')
  @UseGuards(AuthGuard, new RolesGuard([UserRole.ADMIN]))
  @ApiResponse({ status: HttpStatus.OK })
  async getUserByLogin(@Param('login') login: string) {
    return await this.userService.getUserByLogin(login)
  }

  @Delete(':id')
  @Throttle({ default: THROTTLER_LIMITS.write })
  @UseGuards(AuthGuard, new RolesGuard([UserRole.ADMIN]))
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  async deleteUser(@Param('id') id: string): Promise<void> {
    await this.userService.deleteUserById(id)
  }

  @Delete(':login')
  @Throttle({ default: THROTTLER_LIMITS.write })
  @UseGuards(AuthGuard, new RolesGuard([UserRole.ADMIN]))
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  async deleteUserByLogin(@Param('login') login: string): Promise<void> {
    await this.userService.deleteUserByLogin(login)
  }
}
