import { UserRole } from '@/enums'
import type { userAccounts } from '@gmd/database/schema'

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
  hasCustomAvatar?: boolean
}

export interface LinkPlatformData {
  platform: string
  platformUserId: string
  platformLogin: string
  platformAvatar?: string
}

export type UserAccount = typeof userAccounts.$inferSelect

export interface MergeUsersResult {
  accountsMoved: number
  accountsDropped: number
  likesMoved: number
  likesDropped: number
  suggestionsMoved: number
  wordleGamesMoved: number
  wordleGamesDropped: number
}

export interface UserDomain {
  id: string
  login: string
  role: UserRole
  profileImageUrl: string
  color: string
  hasCustomAvatar: boolean
  createdAt: Date
}
