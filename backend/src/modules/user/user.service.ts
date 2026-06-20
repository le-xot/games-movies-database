import { HttpException, HttpStatus, Injectable, Logger, NotFoundException } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { UserRole } from '@/enums'
import { TwitchService } from '@/modules/twitch/twitch.service'
import { UserDomain } from '@/modules/user/entities/user-domain.entity'
import { LinkPlatformData, UserRepository } from '@/modules/user/repositories/user.repository'
import type { UpdateUsersPayload } from '@/modules/websocket/websocket.events'

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name)

  constructor(
    private readonly userRepository: UserRepository,
    private readonly twitch: TwitchService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async upsertUser(
    platformId: string,
    data: {
      login?: string
      role?: UserRole
      profileImageUrl?: string
      color?: string
    },
    platform: string = 'TWITCH',
  ): Promise<UserDomain> {
    const foundedUser = await this.userRepository.findByPlatformId(platform, platformId)

    if (!foundedUser && data.login && data.profileImageUrl) {
      const createdUser = await this.userRepository.create({
        login: data.login,
        role: data.role ?? UserRole.USER,
        profileImageUrl: data.profileImageUrl,
        color: data.color ?? '#333333',
        platform,
        platformUserId: platformId,
        platformLogin: data.login,
        platformAvatar: data.profileImageUrl,
      })
      this.eventEmitter.emit('update-users', {
        userId: createdUser.id,
        action: 'created',
      } satisfies UpdateUsersPayload)
      return createdUser
    }

    if (!foundedUser) {
      return this.createUserByLogin(data.login)
    }

    const updatedUser = await this.userRepository.update(foundedUser.id, {
      login: data.login,
      role: data.role,
      profileImageUrl: data.profileImageUrl,
      color: data.color,
    })
    this.eventEmitter.emit('update-users', {
      userId: foundedUser.id,
      action: 'updated',
    } satisfies UpdateUsersPayload)
    return updatedUser
  }

  async createUserById(id: string): Promise<UserDomain> {
    try {
      const twitchUser = await this.twitch.getTwitchUserById(id)

      if (!twitchUser) {
        throw new Error(`User with id ${id} not found on Twitch`)
      }

      const createdUser = await this.userRepository.create({
        login: twitchUser.login,
        role: UserRole.USER,
        profileImageUrl:
          twitchUser.profile_image_url ||
          'https://static-cdn.jtvnw.net/user-default-pictures-uv/ead5c8b2-a4c9-4724-b1dd-9f00b46cbd3d-profile_image-300x300.png',
        color: '#333333',
        platform: 'TWITCH',
        platformUserId: twitchUser.id,
        platformLogin: twitchUser.login,
        platformAvatar: twitchUser.profile_image_url,
      })
      this.eventEmitter.emit('update-users', {
        userId: createdUser.id,
        action: 'created',
      } satisfies UpdateUsersPayload)
      return createdUser
    } catch (error) {
      this.logger.error('Error creating user by id:', error as any)
      throw error
    }
  }

  async createUserByLogin(login: string): Promise<UserDomain> {
    try {
      const twitchUsers = await this.twitch.searchTwitchUsers(login)

      if (!twitchUsers || twitchUsers.length === 0) {
        throw new Error(`User with login ${login} not found on Twitch`)
      }

      const twitchUser = twitchUsers[0]

      const createdUser = await this.userRepository.create({
        login: twitchUser.login,
        role: UserRole.USER,
        profileImageUrl:
          twitchUser.profile_image_url ||
          'https://static-cdn.jtvnw.net/user-default-pictures-uv/ead5c8b2-a4c9-4724-b1dd-9f00b46cbd3d-profile_image-300x300.png',
        color: '#333333',
        platform: 'TWITCH',
        platformUserId: twitchUser.id,
        platformLogin: twitchUser.login,
        platformAvatar: twitchUser.profile_image_url,
      })
      this.eventEmitter.emit('update-users', {
        userId: createdUser.id,
        action: 'created',
      } satisfies UpdateUsersPayload)
      return createdUser
    } catch (error) {
      this.logger.error('Error creating user by login:', error as any)
      throw error
    }
  }

  getUserByLogin(login: string): Promise<UserDomain | null> {
    return this.userRepository.findByLogin(login)
  }

  getUserById(id: string): Promise<UserDomain | null> {
    return this.userRepository.findById(id)
  }

  getUserByPlatformId(platform: string, platformUserId: string): Promise<UserDomain | null> {
    return this.userRepository.findByPlatformId(platform, platformUserId)
  }

  getAllUsers(): Promise<UserDomain[]> {
    return this.userRepository.findAll()
  }

  async deleteUserByLogin(login: string): Promise<void> {
    const user = await this.userRepository.findByLogin(login)
    if (!user) {
      throw new NotFoundException('User not found')
    }

    await this.userRepository.deleteWithCascade(user.id)

    this.eventEmitter.emit('update-users', {
      userId: user.id,
      action: 'deleted',
    } satisfies UpdateUsersPayload)
  }

  async deleteUserById(id: string): Promise<void> {
    const user = await this.userRepository.findById(id)
    if (!user) {
      throw new NotFoundException('User not found')
    }

    await this.userRepository.deleteWithCascade(id)

    this.eventEmitter.emit('update-users', {
      userId: id,
      action: 'deleted',
    } satisfies UpdateUsersPayload)
  }

  async updateLogin(userId: string, login: string): Promise<UserDomain> {
    const existing = await this.userRepository.findByLogin(login)
    if (existing && existing.id !== userId) {
      throw new HttpException('This nickname is already taken', HttpStatus.CONFLICT)
    }
    const user = await this.userRepository.update(userId, { login })
    this.eventEmitter.emit('update-users', {
      userId,
      action: 'updated',
    } satisfies UpdateUsersPayload)
    return user
  }

  async linkPlatformAccount(userId: string, data: LinkPlatformData): Promise<void> {
    const existing = await this.userRepository.findByPlatformId(data.platform, data.platformUserId)
    if (existing) {
      throw new Error('This platform account is already linked to another user')
    }
    await this.userRepository.linkPlatformAccount(userId, data)
  }

  async getLinkedAccounts(userId: string) {
    return await (this.userRepository as any).prisma.userAccount.findMany({
      where: { userId },
      select: { platform: true, platformLogin: true, platformAvatar: true },
    })
  }
}
