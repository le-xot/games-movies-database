import { Body, Controller, Delete, Get, HttpStatus, Param, Post, UseGuards } from '@nestjs/common'
import { ApiResponse, ApiTags } from '@nestjs/swagger'
import { Throttle } from '@nestjs/throttler'
import { UserRole } from '@/enums'
import { AuthGuard } from '@/modules/auth/auth.guard'
import { RolesGuard } from '@/modules/auth/auth.roles.guard'
import { UserDomain } from '@/modules/user/entities/user-domain.entity'
import { UserCreateByLoginDTO, UserUpdateDTO } from '@/modules/user/user.dto'
import { UserEntity } from '@/modules/user/user.entity'
import { UserService } from '@/modules/user/user.service'
import { THROTTLER_LIMITS } from '@/utils/throttler'

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Post('login')
  @Throttle({ default: THROTTLER_LIMITS.write })
  @UseGuards(AuthGuard, new RolesGuard([UserRole.ADMIN]))
  @ApiResponse({ status: HttpStatus.CREATED, type: UserEntity })
  async createUserByLogin(@Body() data: UserCreateByLoginDTO): Promise<UserEntity> {
    const user = await this.userService.createUserByLogin(data.login)
    return {
      id: user.id,
      login: user.login,
      role: user.role,
      profileImageUrl: user.profileImageUrl,
      color: user.color,
      createdAt: user.createdAt,
    }
  }

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

  @Post(':id')
  @Throttle({ default: THROTTLER_LIMITS.write })
  @UseGuards(AuthGuard, new RolesGuard([UserRole.ADMIN]))
  @ApiResponse({ status: HttpStatus.OK })
  async patchUser(@Body() data: UserUpdateDTO, @Param('id') id: string): Promise<UserDomain> {
    return await this.userService.upsertUser(id, data)
  }

  @Get(':id')
  @UseGuards(AuthGuard, new RolesGuard([UserRole.ADMIN]))
  @ApiResponse({ status: HttpStatus.OK })
  async getUserByTwitchId(@Param('id') id: string): Promise<UserDomain | null> {
    return await this.userService.getUserById(id)
  }

  @Get(':login')
  @UseGuards(AuthGuard, new RolesGuard([UserRole.ADMIN]))
  @ApiResponse({ status: HttpStatus.OK })
  async getUserByLogin(@Param('login') login: string): Promise<UserDomain | null> {
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
