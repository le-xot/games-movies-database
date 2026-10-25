import { RecordGrade } from '@backend/enums'
import { RecordEntity } from '@backend/modules/record/record.entity'
import { UserEntity } from '@backend/modules/user/user.entity'

export class RatingEntity {
  id!: string

  userId!: string

  recordId!: number

  grade!: RecordGrade

  user?: UserEntity | null

  createdAt!: string

  updatedAt!: string

  constructor(partial: Partial<RatingEntity>) {
    Object.assign(this, partial)
  }
}

export class UserRatedRecordEntity extends RecordEntity {
  userGrade!: RecordGrade

  userLogin!: string

  constructor(partial: Partial<UserRatedRecordEntity>) {
    super(partial)
    Object.assign(this, partial)
  }
}

export class GetUserRatingsEntity {
  items!: UserRatedRecordEntity[]

  total!: number

  constructor(partial: Partial<GetUserRatingsEntity>) {
    Object.assign(this, partial)
  }
}

export class FriendsMemberEntity {
  userId!: string

  login!: string

  profileImageUrl!: string

  counts!: Record<RecordGrade, number>

  total!: number

  constructor(partial: Partial<FriendsMemberEntity>) {
    Object.assign(this, partial)
  }
}

export class GetFriendsEntity {
  members!: FriendsMemberEntity[]

  constructor(partial: Partial<GetFriendsEntity>) {
    Object.assign(this, partial)
  }
}
