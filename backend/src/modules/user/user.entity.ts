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

export class MergeUsersResultEntity {
  accountsMoved!: number

  accountsDropped!: number

  likesMoved!: number

  likesDropped!: number

  ratingsMoved!: number

  ratingsDropped!: number

  suggestionsMoved!: number

  wordleGamesMoved!: number

  wordleGamesDropped!: number
}
