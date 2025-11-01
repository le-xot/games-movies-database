import { PrismaService } from '@/database/prisma.service'
import { Injectable } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { $Enums, User } from '@prisma/client'
import { RecordEntity } from '../record/record.entity'
import { TwitchService } from '../twitch/twitch.service'

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService, private twitch: TwitchService, private readonly eventEmitter: EventEmitter2) {}

  async upsertUser(
    id: string,
    data: {
      login?: string
      role?: $Enums.UserRole
      profileImageUrl?: string
      color?: string
    },
  ): Promise<User> {
    const foundedUser = await this.prisma.user.findFirst({
      where: { id },
    })

    if (!foundedUser && data.login && data.profileImageUrl && data.role && data.color) {
      const createdUser = await this.prisma.user.create({
        data: {
          id,
          login: data.login,
          role: data.role,
          profileImageUrl: data.profileImageUrl,
          color: data.color,
        },
      })
      this.eventEmitter.emit('WebSocketUpdate')
      return createdUser
    }

    if (!foundedUser) {
      return this.createUserByLogin(data.login)
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        login: data.login,
        role: data.role,
        profileImageUrl: data.profileImageUrl,
        color: data.color,
      },
    })
    this.eventEmitter.emit('WebSocketUpdate')
    return updatedUser
  }

  async getUserRecords(login: string): Promise<RecordEntity[]> {
    return await this.prisma.record.findMany({
      where: { user: { login } },
      include: { user: true },
    })
  }

  async createUserById(id: string): Promise<User> {
    try {
      const twitchUser = await this.twitch.getTwitchUserById(id)

      if (!twitchUser) {
        throw new Error(`User with id ${id} not found on Twitch`)
      }

      const createdUser = await this.prisma.user.create({
        data: {
          id: twitchUser.id,
          login: twitchUser.login,
          role: $Enums.UserRole.USER,
          profileImageUrl: twitchUser.profile_image_url || 'https://static-cdn.jtvnw.net/user-default-pictures-uv/ead5c8b2-a4c9-4724-b1dd-9f00b46cbd3d-profile_image-300x300.png',
          color: '#333333',
        },
      })
      this.eventEmitter.emit('WebSocketUpdate')
      return createdUser
    } catch (error) {
      console.error('Error creating user by id:', error)
      throw error
    }
  }

  async createUserByLogin(login: string): Promise<User> {
    try {
      const twitchUsers = await this.twitch.searchTwitchUsers(login)

      if (!twitchUsers || twitchUsers.length === 0) {
        throw new Error(`User with login ${login} not found on Twitch`)
      }

      const twitchUser = twitchUsers[0]

      const createdUser = await this.prisma.user.create({
        data: {
          id: twitchUser.id,
          login: twitchUser.login,
          role: $Enums.UserRole.USER,
          profileImageUrl: twitchUser.profile_image_url || 'https://static-cdn.jtvnw.net/user-default-pictures-uv/ead5c8b2-a4c9-4724-b1dd-9f00b46cbd3d-profile_image-300x300.png',
          color: '#333333',
        },
      })
      this.eventEmitter.emit('WebSocketUpdate')
      return createdUser
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
    this.eventEmitter.emit('WebSocketUpdate')
  }

  async deleteUserById(id: string): Promise<void> {
    await this.prisma.user.delete({ where: { id } })
    this.eventEmitter.emit('WebSocketUpdate')
  }
}
