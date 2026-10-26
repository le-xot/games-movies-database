import { UserRole } from '@backend/enums'
import type { AccountPlatform } from '@backend/enums'
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
  avatarFrameId?: string | null | undefined
  unlockedAvatarFrameIds?: string[] | undefined
}

/** Правка косметики: отсутствие поля = не менять, `null` = сбросить. */
export interface UpdateCustomizationData {
  avatarFrameId?: string | null | undefined
}

/** Состояние косметики для аккаунт-диалога: что выбрано и что уже открыто. */
export interface UserCustomization {
  avatarFrameId: string | null
  unlockedAvatarFrameIds: string[]
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
  ratingsMoved: number
  ratingsDropped: number
  suggestionsMoved: number
  wordleGamesMoved: number
  wordleGamesDropped: number
}

export type UserDomain = SelectRow<'users'>
