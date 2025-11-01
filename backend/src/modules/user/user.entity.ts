import { ApiProperty } from '@nestjs/swagger'
import { UserRole } from '@prisma/client'

export class UserEntity {
  @ApiProperty()
  id: string

  @ApiProperty()
  login: string

  @ApiProperty({ enum: UserRole })
  role: UserRole

  @ApiProperty()
  profileImageUrl: string

  @ApiProperty()
  color: string

  @ApiProperty()
  createdAt: Date

  constructor(partial: Partial<UserEntity>) {
    Object.assign(this, partial)
  }
}
