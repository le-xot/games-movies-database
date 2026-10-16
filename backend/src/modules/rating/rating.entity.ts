import { ApiProperty } from '@nestjs/swagger'
import { RecordGrade } from '@/enums'
import { RecordGrade as RecordGradeName } from '@/enums/enums.names'
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
