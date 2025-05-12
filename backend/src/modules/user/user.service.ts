import { Injectable } from '@nestjs/common'
import { $Enums, User } from '@prisma/client'
import { PrismaService } from '../../database/prisma.service'
import { RecordEntity } from '../record/record.entity'
import { TwitchService } from '../twitch/twitch.service'

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService, private twitch: TwitchService) {}

  upsertUser(
    id: string,
    data: {
      login?: string
      role?: $Enums.UserRole
      profileImageUrl?: string
      color?: string
    },
  ): Promise<User> {
    return this.prisma.user.upsert({
      where: { id },
      update: {
        login: data.login,
        role: data.role,
        profileImageUrl: data.profileImageUrl,
        color: data.color,
      },
      create: {
        id,
        login: data.login,
        role: $Enums.UserRole.USER,
        profileImageUrl: data.profileImageUrl,
        color: data.color || '#333333',
      },
    })
  }

  async getUserRecords(login: string): Promise<RecordEntity[]> {
    return await this.prisma.record.findMany({
      where: { user: { login } },
      include: { user: true },
    })
  }

  async createUserByLogin(login: string): Promise<User> {
    try {
      const accessToken = await this.twitch.getAppAccessToken()
      const twitchUsers = await this.twitch.searchTwitchUsers(login, accessToken)

      if (!twitchUsers || twitchUsers.length === 0) {
        throw new Error(`User with login ${login} not found on Twitch`)
      }

      const twitchUser = twitchUsers[0]

      return this.prisma.user.create({
        data: {
          id: twitchUser.id,
          login: twitchUser.login,
          role: $Enums.UserRole.USER,
          profileImageUrl: twitchUser.profile_image_url || 'https://static-cdn.jtvnw.net/user-default-pictures-uv/ead5c8b2-a4c9-4724-b1dd-9f00b46cbd3d-profile_image-300x300.png',
          color: '#333333',
        },
      })
    } catch (error) {
      console.error('Error creating user by login:', error)
      throw error
    }
  }

  getUserByLogin(login: string): Promise<User> {
    return this.prisma.user.findUnique({ where: { login } })
  }

  getUserById(id: string): Promise<User> {
    return this.prisma.user.findUnique({ where: { id } })
  }

  getAllUsers(): Promise<User[]> {
    return this.prisma.user.findMany()
  }

  async deleteUserByLogin(login: string): Promise<void> {
    await this.prisma.user.delete({ where: { login } })
  }

  async deleteUserById(id: string): Promise<void> {
    await this.prisma.user.delete({ where: { id } })
  }
}
