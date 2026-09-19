import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { AccountPlatform, UserRole } from '@/enums'
import { AvatarService } from '@/modules/avatar/avatar.service'
import { LinkPlatformData, UserDomain } from '@/modules/user/entities/user-domain.entity'
import { DrizzleUserRepository } from '@/modules/user/repositories/drizzle-user.repository'
import { WsEvents, type UpdateUsersPayload } from '@/modules/websocket/websocket.events'

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name)

  constructor(
    private readonly userRepository: DrizzleUserRepository,
    private readonly eventEmitter: EventEmitter2,
    private readonly avatarService: AvatarService,
  ) {}

  private emitUserUpdate(userId: string, action: UpdateUsersPayload['action']) {
    this.eventEmitter.emit(WsEvents.UPDATE_USERS, {
      userId,
      action,
    } satisfies UpdateUsersPayload)
  }

  private async safeGenerateDefaultAvatar(
    userId: string,
    login: string,
    fallback: string,
  ): Promise<string> {
    try {
      return await this.avatarService.generateAndStoreDefaultAvatar(userId, login)
    } catch (e) {
      this.logger.warn(`Failed to generate default avatar for userId=${userId}`)
      this.logger.error(e)
      return fallback
    }
  }

  async upsertUser(
    platformId: string,
    data: {
      login: string
      role?: UserRole
      platformAvatar?: string
      color?: string
    },
    platform: string,
  ): Promise<UserDomain> {
    const foundUser = await this.userRepository.findByPlatformId(platform, platformId)

    if (foundUser) {
      if (foundUser.hasCustomAvatar) {
        const updatedUser = await this.userRepository.update(foundUser.id, {
          role: data.role,
          color: data.color,
        })
        this.emitUserUpdate(foundUser.id, 'updated')
        return updatedUser
      }

      const profileImageUrl = await this.safeGenerateDefaultAvatar(
        foundUser.id,
        data.login,
        foundUser.profileImageUrl,
      )
      const updatedUser = await this.userRepository.update(foundUser.id, {
        role: data.role,
        profileImageUrl,
        color: data.color,
      })
      this.emitUserUpdate(foundUser.id, 'updated')
      return updatedUser
    }

    const createdUser = await this.userRepository.create({
      login: data.login,
      role: data.role ?? UserRole.USER,
      profileImageUrl: '',
      color: data.color ?? '#333333',
      platform,
      platformUserId: platformId,
      platformLogin: data.login,
      platformAvatar: data.platformAvatar,
    })

    const profileImageUrl = await this.safeGenerateDefaultAvatar(createdUser.id, data.login, '')
    const user = await this.userRepository.update(createdUser.id, { profileImageUrl })

    this.emitUserUpdate(user.id, 'created')
    return user
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

  async deleteUserById(id: string): Promise<void> {
    const user = await this.userRepository.findById(id)
    if (!user) {
      throw new NotFoundException('User not found')
    }

    await this.userRepository.deleteWithCascade(id)

    this.emitUserUpdate(id, 'deleted')
  }

  async updateLogin(userId: string, login: string): Promise<UserDomain> {
    const existing = await this.userRepository.findByLogin(login)
    if (existing && existing.id !== userId) {
      throw new ConflictException('Логин уже занят')
    }

    const user = await this.userRepository.update(userId, { login })
    this.emitUserUpdate(userId, 'updated')
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

  async unlinkPlatformAccount(userId: string, platform: AccountPlatform): Promise<void> {
    const accounts = await this.userRepository.findAccountsByUserId(userId)
    if (accounts.length <= 1) {
      throw new HttpException('Cannot unlink the last account', HttpStatus.BAD_REQUEST)
    }

    await this.userRepository.unlinkPlatformAccount(userId, platform)
  }

  getLinkedAccounts(userId: string) {
    return this.userRepository.findAccountsByUserId(userId)
  }

  async uploadAvatar(userId: string, imageBuffer: Buffer): Promise<UserDomain> {
    const user = await this.userRepository.findById(userId)
    if (!user) {
      throw new NotFoundException('User not found')
    }

    const s3Key = await this.avatarService.processAndStoreAvatar(userId, imageBuffer)
    const updatedUser = await this.userRepository.update(userId, {
      profileImageUrl: s3Key,
      hasCustomAvatar: true,
    })

    this.emitUserUpdate(userId, 'updated')

    return updatedUser
  }

  async deleteAvatar(userId: string): Promise<UserDomain> {
    const user = await this.userRepository.findById(userId)
    if (!user) {
      throw new NotFoundException('User not found')
    }

    const profileImageUrl = await this.avatarService.generateAndStoreDefaultAvatar(
      userId,
      user.login,
    )

    const updatedUser = await this.userRepository.update(userId, {
      profileImageUrl,
      hasCustomAvatar: false,
    })

    this.emitUserUpdate(userId, 'updated')

    return updatedUser
  }
}
