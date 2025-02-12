import { ApiProperty } from '@nestjs/swagger'
import { $Enums, User } from '@prisma/client'
import { RolesEnum } from '../../enums/enums.names'

export class UserEntity implements User {
  @ApiProperty()
  id: string

  @ApiProperty()
  login: string

  @ApiProperty({ enumName: RolesEnum, enum: $Enums.PrismaRoles })
  role: $Enums.PrismaRoles

  @ApiProperty()
  profileImageUrl: string

  @ApiProperty()
  createdAt: Date
}
