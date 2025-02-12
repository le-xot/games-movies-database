import { Body, Controller, Get, HttpStatus, Param, Post, UseGuards } from '@nestjs/common'
import { ApiResponse, ApiTags } from '@nestjs/swagger'
import { $Enums, User } from '@prisma/client'
import { AuthGuard } from '../auth/auth.guard'
import { RolesGuard } from '../auth/auth.roles.guard'
import { UpsertUserDTO, UserDTO } from './user.dto'
import { UserEntity } from './user.entity'
import { UserService } from './user.service'

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Post()
  async createOrUpdateUser(@Body() user: UpsertUserDTO): Promise<UserDTO> {
    return await this.userService.upsertUser(user)
  }

  @Get(':id')
  @ApiResponse({ status: HttpStatus.OK })
  async getUserByTwitchId(@Param('id') id: string): Promise<User> {
    return await this.userService.getUserById(id)
  }

  @Get()
  @UseGuards(AuthGuard, new RolesGuard([$Enums.PrismaRoles.ADMIN]))
  @ApiResponse({ status: 200, type: UserEntity, isArray: true })
  async getAllUsers(): Promise<User[]> {
    return await this.userService.getAllUsers()
  }
}
