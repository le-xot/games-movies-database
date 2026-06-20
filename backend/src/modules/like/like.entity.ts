import { ApiProperty } from '@nestjs/swagger'
import { UserEntity } from '@/modules/user/user.entity'

export class LikeEntity {
  @ApiProperty()
  id: string

  @ApiProperty()
  userId: string

  @ApiProperty()
  recordId: number

  @ApiProperty({ type: UserEntity, required: false, nullable: true })
  user?: UserEntity | null

  @ApiProperty()
  createdAt: Date

  constructor(partial: Partial<LikeEntity>) {
    Object.assign(this, partial)
  }
}
