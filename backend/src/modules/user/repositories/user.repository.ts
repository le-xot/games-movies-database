import { UserRole } from '@/enums'
import { UserDomain } from '@/modules/user/entities/user-domain.entity'

export interface CreateUserData {
  login: string
  role: UserRole
  profileImageUrl: string
  color: string
  platform: string
  platformUserId: string
  platformLogin: string
  platformAvatar?: string
}

export interface UpdateUserData {
  login?: string
  role?: UserRole
  profileImageUrl?: string
  color?: string
}

export interface LinkPlatformData {
  platform: string
  platformUserId: string
  platformLogin: string
  platformAvatar?: string
}

export abstract class UserRepository {
  abstract findByPlatformId(platform: string, platformUserId: string): Promise<UserDomain | null>
  abstract findByLogin(login: string): Promise<UserDomain | null>
  abstract findById(id: string): Promise<UserDomain | null>
  abstract create(data: CreateUserData): Promise<UserDomain>
  abstract update(id: string, data: UpdateUserData): Promise<UserDomain>
  abstract findAll(): Promise<UserDomain[]>
  abstract deleteWithCascade(userId: string): Promise<void>
  abstract linkPlatformAccount(userId: string, data: LinkPlatformData): Promise<void>
}
