import { UserRole } from '@/enums'

export interface UserDomain {
  id: string
  login: string
  role: UserRole
  profileImageUrl: string
  color: string
  createdAt: Date
}
