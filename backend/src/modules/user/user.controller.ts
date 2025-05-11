import { Body, Controller, Delete, Get, HttpStatus, Param, Post, UseGuards } from '@nestjs/common'
import { ApiResponse, ApiTags } from '@nestjs/swagger'
import { $Enums, User } from '@prisma/client'
import { AuthGuard } from '../auth/auth.guard'
import { RolesGuard } from '../auth/auth.roles.guard'
import { UserUpsertDto } from './user.dto'
import { UserEntity } from './user.entity'
import { UserService } from './user.service'

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Post()
  @ApiResponse({ status: HttpStatus.CREATED })
  async createOrUpdateUser(@Body() id: string, @Body() data: UserUpsertDto): Promise<UserEntity> {
    const user = await this.userService.upsertUser(id, data)
    return {
      id: user.id,
      login: user.login,
      role: user.role,
      profileImageUrl: user.profileImageUrl,
      color: user.color,
      createdAt: user.createdAt,
    }
  }

  @Get(':id')
  @ApiResponse({ status: HttpStatus.OK })
  async getUserByTwitchId(@Param('id') id: string): Promise<User> {
    return await this.userService.getUserById(id)
  }

  @Get(':login')
  @ApiResponse({ status: HttpStatus.OK })
  async getUserByLogin(@Param('login') login: string): Promise<User> {
    return await this.userService.getUserByLogin(login)
  }

  @Get()
  @UseGuards(AuthGuard, new RolesGuard([$Enums.UserRole.ADMIN]))
  @ApiResponse({ status: 200, type: UserEntity, isArray: true })
  async getAllUsers(): Promise<User[]> {
    return await this.userService.getAllUsers()
  }

  @Delete(':id')
  @UseGuards(AuthGuard, new RolesGuard([$Enums.UserRole.ADMIN]))
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  async deleteUser(@Param('id') id: string): Promise<void> {
    await this.userService.deleteUserById(id)
  }

  @Delete(':login')
  @UseGuards(AuthGuard, new RolesGuard([$Enums.UserRole.ADMIN]))
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  async deleteUserByLogin(@Param('login') login: string): Promise<void> {
    await this.userService.deleteUserByLogin(login)
  }
}
