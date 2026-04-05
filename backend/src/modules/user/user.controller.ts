import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { ApiResponse, ApiTags } from '@nestjs/swagger'
import { UserRole } from '@/enums'
import { AuthGuard } from '@/modules/auth/auth.guard'
import { RolesGuard } from '@/modules/auth/auth.roles.guard'
import { RecordEntity } from '@/modules/record/record.entity'
import { ProfileStatsEntity } from '@/modules/user/profile-stats.entity'
import { UserCreateByLoginDTO, UserUpdateDTO } from '@/modules/user/user.dto'
import { UserDomain } from '@/modules/user/entities/user-domain.entity'
import { UserEntity } from '@/modules/user/user.entity'
import { UserService } from '@/modules/user/user.service'

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Post('login')
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

  @Get('user-records')
  @UseGuards(AuthGuard, new RolesGuard([UserRole.USER, UserRole.ADMIN]))
  @ApiResponse({ status: HttpStatus.OK, type: RecordEntity, isArray: true })
  async getUserRecords(@Query('login') login: string): Promise<RecordEntity[]> {
    return await this.userService.getUserRecords(login)
  }

  @Get('user-records-by-id')
  @UseGuards(AuthGuard, new RolesGuard([UserRole.USER, UserRole.ADMIN]))
  @ApiResponse({ status: HttpStatus.OK, type: RecordEntity, isArray: true })
  async getUserRecordsById(@Query('id') id: string): Promise<RecordEntity[]> {
    return await this.userService.getUserRecordsById(id)
  }

  @Post(':id')
  @UseGuards(AuthGuard, new RolesGuard([UserRole.ADMIN]))
  @ApiResponse({ status: HttpStatus.OK })
  async patchUser(@Body() data: UserUpdateDTO, @Param('id') id: string): Promise<UserDomain> {
    return await this.userService.upsertUser(id, data)
  }

  @Get('profile/:login')
  @UseGuards(AuthGuard)
  @ApiResponse({ type: ProfileStatsEntity })
  async getUserProfileStats(@Param('login') login: string) {
    return await this.userService.getUserProfileStats(login)
  }

  @Get('profile-by-id/:id')
  @UseGuards(AuthGuard)
  @ApiResponse({ type: ProfileStatsEntity })
  async getUserProfileStatsById(@Param('id') id: string) {
    return await this.userService.getUserProfileStatsById(id)
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
  @UseGuards(AuthGuard, new RolesGuard([UserRole.ADMIN]))
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  async deleteUser(@Param('id') id: string): Promise<void> {
    await this.userService.deleteUserById(id)
  }

  @Delete(':login')
  @UseGuards(AuthGuard, new RolesGuard([UserRole.ADMIN]))
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  async deleteUserByLogin(@Param('login') login: string): Promise<void> {
    await this.userService.deleteUserByLogin(login)
  }
}
