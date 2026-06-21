import { UserRole } from '@/enums'

export interface UserDomain {
  id: string
  login: string
  role: UserRole
  profileImageUrl: string
  color: string
  hasCustomAvatar: boolean
  createdAt: Date
}
