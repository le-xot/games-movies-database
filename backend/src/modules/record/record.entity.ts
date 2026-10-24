import { RecordGenre, RecordGrade, RecordStatus, RecordType } from '@backend/enums'
import { LikeEntity } from '@backend/modules/like/like.entity'
import { UserEntity } from '@backend/modules/user/user.entity'

export class SuggestionOwnershipEntity {
  id!: number

  recordId!: number

  userId!: string

  user?: UserEntity | null

  createdAt!: Date

  constructor(partial: Partial<SuggestionOwnershipEntity>) {
    Object.assign(this, partial)
  }
}

export class RecordEntity {
  id!: number

  title!: string

  link!: string

  posterUrl!: string

  status!: RecordStatus | null

  type!: RecordType | null

  genre!: RecordGenre | null

  grade!: RecordGrade | null

  friendsCounts?: Record<RecordGrade, number> | null

  friendsTotal?: number | null

  friendsTop?: RecordGrade | null

  myGrade?: RecordGrade | null

  episode!: string | null

  extra?: unknown

  suggestionOwnership?: SuggestionOwnershipEntity | null

  likes?: LikeEntity[] | null

  createdAt!: Date

  constructor(partial: Partial<RecordEntity>) {
    Object.assign(this, partial)
  }
}
