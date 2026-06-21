import { HttpException, HttpStatus, Injectable, Logger, NotFoundException } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { UserRole } from '@/enums'
import { UserDomain } from '@/modules/user/entities/user-domain.entity'
import { LinkPlatformData, UserRepository } from '@/modules/user/repositories/user.repository'
import { UpdateUsersPayload } from '@/modules/websocket/websocket.events'

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name)

  constructor(
    private readonly userRepository: UserRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async upsertUser(
    platformId: string,
    data: {
      login: string
      role?: UserRole
      profileImageUrl: string
      color?: string
    },
    platform: string,
  ): Promise<UserDomain> {
    const foundUser = await this.userRepository.findByPlatformId(platform, platformId)

    if (foundUser) {
      const updatedUser = await this.userRepository.update(foundUser.id, {
        role: data.role,
        profileImageUrl: data.profileImageUrl,
        color: data.color,
      })
      this.eventEmitter.emit('update-users', {
        userId: foundUser.id,
        action: 'updated',
      } satisfies UpdateUsersPayload)
      return updatedUser
    }

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
    const user = await this.userRepository.update(userId, { login })
    this.eventEmitter.emit('update-users', {
      userId,
      action: 'updated',
    } satisfies UpdateUsersPayload)
    return user
  }

  async linkPlatformAccount(userId: string, data: LinkPlatformData): Promise<void> {
    this.logger.log(
      `linkPlatformAccount: userId=${userId}, platform=${data.platform}, platformUserId=${data.platformUserId}`,
    )
    const existing = await this.userRepository.findByPlatformId(data.platform, data.platformUserId)
    if (existing) {
      this.logger.warn(
        `linkPlatformAccount: platform ${data.platform}/${data.platformUserId} already linked to userId=${existing.id}`,
      )
      throw new Error('This platform account is already linked to another user')
    }
    await this.userRepository.linkPlatformAccount(userId, data)
    this.logger.log(
      `linkPlatformAccount: successfully linked ${data.platform}/${data.platformUserId} to userId=${userId}`,
    )
  }

  async unlinkPlatformAccount(userId: string, platform: string): Promise<void> {
    const accounts = await this.userRepository.findAccountsByUserId(userId)
    if (accounts.length <= 1) {
      throw new HttpException('Cannot unlink the last account', HttpStatus.BAD_REQUEST)
    }

    await this.userRepository.unlinkPlatformAccount(userId, platform)
  }

  getLinkedAccounts(userId: string) {
    return this.userRepository.findAccountsByUserId(userId)
  }
}
