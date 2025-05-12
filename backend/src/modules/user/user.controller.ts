import { Body, Controller, Delete, Get, HttpStatus, Param, Post, Query, UseGuards } from '@nestjs/common'
import { ApiResponse, ApiTags } from '@nestjs/swagger'
import { $Enums, User } from '@prisma/client'
import { AuthGuard } from '../auth/auth.guard'
import { RolesGuard } from '../auth/auth.roles.guard'
import { RecordEntity } from '../record/record.entity'
import { UserCreateByLoginDTO, UserUpdateDTO } from './user.dto'
import { UserEntity } from './user.entity'
import { UserService } from './user.service'

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Post('login')
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
    return users.map(user => ({
      id: user.id,
      login: user.login,
      role: user.role,
      profileImageUrl: user.profileImageUrl,
      color: user.color,
      createdAt: user.createdAt,
    }))
  }

  @Get('user-records')
  @UseGuards(AuthGuard)
  @ApiResponse({ status: HttpStatus.OK, type: RecordEntity, isArray: true })
  async getUserRecords(@Query('login') login: string): Promise<RecordEntity[]> {
    return await this.userService.getUserRecords(login)
  }

  @Post(':id')
  @ApiResponse({ status: HttpStatus.OK })
  async patchUser(@Body() data: UserUpdateDTO, @Param('id') id: string): Promise<User> {
    return await this.userService.upsertUser(id, data)
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
