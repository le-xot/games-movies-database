import { ApiProperty } from '@nestjs/swagger'
import { RecordGrade } from '@/enums'
import { RecordGrade as RecordGradeName } from '@/enums/enums.names'
import { RecordEntity } from '@/modules/record/record.entity'
import { UserEntity } from '@/modules/user/user.entity'

export class RatingEntity {
  @ApiProperty()
  id!: string

  @ApiProperty()
  userId!: string

  @ApiProperty()
  recordId!: number

  @ApiProperty({ enum: RecordGrade, enumName: RecordGradeName })
  grade!: RecordGrade

  @ApiProperty({ type: UserEntity, required: false, nullable: true })
  user?: UserEntity | null

  @ApiProperty()
  createdAt!: Date

  @ApiProperty()
  updatedAt!: Date

  constructor(partial: Partial<RatingEntity>) {
    Object.assign(this, partial)
  }
}

export class UserRatedRecordEntity extends RecordEntity {
  @ApiProperty({ enum: RecordGrade, enumName: RecordGradeName })
  userGrade!: RecordGrade

  @ApiProperty()
  userLogin!: string

  constructor(partial: Partial<UserRatedRecordEntity>) {
    super(partial)
    Object.assign(this, partial)
  }
}

export class GetUserRatingsEntity {
  @ApiProperty({ type: UserRatedRecordEntity, isArray: true })
  items!: UserRatedRecordEntity[]

  @ApiProperty()
  total!: number

  constructor(partial: Partial<GetUserRatingsEntity>) {
    Object.assign(this, partial)
  }
}

export class FriendsMemberEntity {
  @ApiProperty()
  userId!: string

  @ApiProperty()
  login!: string

  @ApiProperty()
  profileImageUrl!: string

  @ApiProperty({ type: Object, example: { DISLIKE: 0, BEER: 1, LIKE: 2, RECOMMEND: 3 } })
  counts!: Record<RecordGrade, number>

  @ApiProperty()
  total!: number

  constructor(partial: Partial<FriendsMemberEntity>) {
    Object.assign(this, partial)
  }
}

export class GetFriendsEntity {
  @ApiProperty({ type: FriendsMemberEntity, isArray: true })
  members!: FriendsMemberEntity[]

  constructor(partial: Partial<GetFriendsEntity>) {
    Object.assign(this, partial)
  }
}
