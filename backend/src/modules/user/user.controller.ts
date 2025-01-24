import { Body, Controller, Get, HttpStatus, Post, Query, UseGuards } from '@nestjs/common'
import { ApiResponse, ApiTags } from '@nestjs/swagger'
import { PrismaRoles, User } from '@prisma/client'
import { AuthGuard } from '../auth/auth.guard'
import { RolesGuard } from '../auth/auth.roles.guard'
import { UpsertUserDTO, UserDTO } from './user.dto'
import { UserEntity } from './user.entity'
import { UserServices } from './user.service'

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private userService: UserServices) {}

  @Post('/createOrUpdateUser')
  async createOrUpdateUser(@Body() user: UpsertUserDTO): Promise<UserDTO> {
    const { login, twitchId, role } = user
    return await this.userService.upsertUser(login, twitchId, role)
  }

  @Get('/getUserByTwitchId')
  @ApiResponse({ status: HttpStatus.OK })
  async getUserByTwitchId(@Query('twitchId') twitchId: string): Promise<User> {
    return await this.userService.getUserByTwitchId(twitchId)
  }

  @Get('/getAllUsers')
  @UseGuards(AuthGuard, new RolesGuard([PrismaRoles.ADMIN]))
  @ApiResponse({ status: 200, type: UserEntity, isArray: true })
  async getAllUsers(): Promise<User[]> {
    return await this.userService.getAllUsers()
  }
}
