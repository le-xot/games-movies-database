import { HttpException, HttpStatus, Injectable, Logger, NotFoundException } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { UserRole } from '@/enums'
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
      if (!foundUser.hasCustomAvatar) {
        const s3Key = data.profileImageUrl
          ? await this.avatarService.fetchAndStoreOAuthAvatar(foundUser.id, data.profileImageUrl)
          : null
        const profileImageUrl = data.profileImageUrl
          ? (s3Key ?? data.profileImageUrl)
          : foundUser.profileImageUrl
        const updatedUser = await this.userRepository.update(foundUser.id, {
          role: data.role,
          profileImageUrl,
          color: data.color,
        })
        this.emitUserUpdate(foundUser.id, 'updated')
        return updatedUser
      }

      const updatedUser = await this.userRepository.update(foundUser.id, {
        role: data.role,
        color: data.color,
      })
      this.emitUserUpdate(foundUser.id, 'updated')
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

    let user = createdUser
    if (data.profileImageUrl) {
      const s3Key = await this.avatarService.fetchAndStoreOAuthAvatar(
        createdUser.id,
        data.profileImageUrl,
      )
      if (s3Key) {
        user = await this.userRepository.update(createdUser.id, { profileImageUrl: s3Key })
      }
    }

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

    await this.avatarService.deleteAvatarFromS3(userId)

    const accounts = await this.userRepository.findAccountsByUserId(userId)
    const oauthAvatar =
      accounts.find((a) => a.platformAvatar)?.platformAvatar ?? user.profileImageUrl

    const updatedUser = await this.userRepository.update(userId, {
      profileImageUrl: oauthAvatar,
      hasCustomAvatar: false,
    })

    this.emitUserUpdate(userId, 'updated')

    return updatedUser
  }
}
