import { UserRole } from '@backend/enums'

export class UserEntity {
  id!: string

  login!: string

  role!: UserRole

  profileImageUrl!: string

  color!: string

  hasCustomAvatar!: boolean

  avatarFrameId!: string | null

  createdAt!: string

  constructor(partial: Partial<UserEntity>) {
    Object.assign(this, partial)
  }
}
