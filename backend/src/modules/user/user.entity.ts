import { ApiProperty } from '@nestjs/swagger'
import { $Enums } from '@prisma/client'
import { UserRole } from '@/enums/enums.names'

export class UserEntity {
  @ApiProperty()
  id: string

  @ApiProperty()
  login: string

  @ApiProperty({ enum: $Enums.UserRole, enumName: UserRole })
  role: $Enums.UserRole

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
