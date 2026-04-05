import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { UserRole } from '@/enums'
import { RecordEntity } from '@/modules/record/record.entity'
import { TwitchService } from '@/modules/twitch/twitch.service'
import { UserDomain } from '@/modules/user/entities/user-domain.entity'
import { UserRepository } from '@/modules/user/repositories/user.repository'
import { ProfileStatsDomain } from '@/modules/user/entities/user-domain.entity'
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
    id: string,
    data: {
      login?: string
      role?: UserRole
      profileImageUrl?: string
      color?: string
    },
  ): Promise<UserDomain> {
    const foundedUser = await this.userRepository.findByTwitchId(id)

    if (!foundedUser && data.login && data.profileImageUrl && data.role && data.color) {
      const createdUser = await this.userRepository.create({
        id,
        login: data.login,
        role: data.role,
        profileImageUrl: data.profileImageUrl,
        color: data.color,
      })
      this.eventEmitter.emit('update-users', {
        userId: id,
        action: 'created',
      } satisfies UpdateUsersPayload)
      return createdUser
    }

    if (!foundedUser) {
      return this.createUserByLogin(data.login)
    }

    const updatedUser = await this.userRepository.update(id, {
      login: data.login,
      role: data.role,
      profileImageUrl: data.profileImageUrl,
      color: data.color,
    })
    this.eventEmitter.emit('update-users', {
      userId: id,
      action: 'updated',
    } satisfies UpdateUsersPayload)
    return updatedUser
  }

  getUserRecords(login: string): Promise<RecordEntity[]> {
    return this.userRepository.getRecordsByLogin(login)
  }

  getUserRecordsById(id: string): Promise<RecordEntity[]> {
    return this.userRepository.getRecordsById(id)
  }

  async createUserById(id: string): Promise<UserDomain> {
    try {
      const twitchUser = await this.twitch.getTwitchUserById(id)

      if (!twitchUser) {
        throw new Error(`User with id ${id} not found on Twitch`)
      }

      const createdUser = await this.userRepository.create({
        id: twitchUser.id,
        login: twitchUser.login,
        role: UserRole.USER,
        profileImageUrl:
          twitchUser.profile_image_url ||
          'https://static-cdn.jtvnw.net/user-default-pictures-uv/ead5c8b2-a4c9-4724-b1dd-9f00b46cbd3d-profile_image-300x300.png',
        color: '#333333',
      })
      this.eventEmitter.emit('update-users', {
        userId: id,
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
        id: twitchUser.id,
        login: twitchUser.login,
        role: UserRole.USER,
        profileImageUrl:
          twitchUser.profile_image_url ||
          'https://static-cdn.jtvnw.net/user-default-pictures-uv/ead5c8b2-a4c9-4724-b1dd-9f00b46cbd3d-profile_image-300x300.png',
        color: '#333333',
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

  async getUserProfileStats(login: string): Promise<ProfileStatsDomain> {
    const user = await this.userRepository.findByLogin(login)
    if (!user) {
      throw new NotFoundException('User not found')
    }
    return this.userRepository.getProfileStats(login)
  }

  async getUserProfileStatsById(id: string): Promise<ProfileStatsDomain> {
    const user = await this.userRepository.findById(id)
    if (!user) {
      throw new NotFoundException('User not found')
    }
    return this.userRepository.getProfileStatsById(id)
  }
}
