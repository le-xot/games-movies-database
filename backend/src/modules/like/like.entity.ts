import { ApiProperty } from '@nestjs/swagger'

export class LikeEntity {
  @ApiProperty()
  id: string

  @ApiProperty()
  userId: string

  @ApiProperty()
  recordId: number

  @ApiProperty()
  createdAt: Date

  constructor(partial: Partial<LikeEntity>) {
    Object.assign(this, partial)
  }
}
