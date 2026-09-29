import { UserRole } from '@/enums'
import type { AccountPlatform } from '@/enums'
import type { SelectRow } from '@gmd/database'

export interface CreateUserData {
  login: string
  role: UserRole
  profileImageUrl: string
  color: string
  platform: AccountPlatform
  platformUserId: string
  platformLogin: string
  platformAvatar?: string | undefined
}

export interface UpdateUserData {
  login?: string | undefined
  role?: UserRole | undefined
  profileImageUrl?: string | undefined
  color?: string | undefined
  hasCustomAvatar?: boolean | undefined
}

export interface LinkPlatformData {
  platform: AccountPlatform
  platformUserId: string
  platformLogin: string
  platformAvatar?: string | undefined
}

export type UserAccount = SelectRow<'userAccounts'>

export interface MergeUsersResult {
  accountsMoved: number
  accountsDropped: number
  likesMoved: number
  likesDropped: number
  suggestionsMoved: number
  wordleGamesMoved: number
  wordleGamesDropped: number
}

export type UserDomain = SelectRow<'users'>
