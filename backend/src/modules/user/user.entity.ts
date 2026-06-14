import { ApiProperty } from '@nestjs/swagger'
import { UserRole } from '@/enums'
import { UserRole as UserRoleName } from '@/enums/enums.names'

export class UserEntity {
  @ApiProperty()
  id: string

  @ApiProperty()
  login: string

  @ApiProperty({ enum: UserRole, enumName: UserRoleName })
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
