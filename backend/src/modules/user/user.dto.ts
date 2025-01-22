import { ApiProperty } from '@nestjs/swagger'
import { $Enums } from '@prisma/client'
import { IsString } from 'class-validator'

export class CreateUserDTO {
  @ApiProperty({ example: 'Joe' })
  @IsString()
  username: string

  @ApiProperty({ example: 'Doe' })
  @IsString()
  password: string

  @ApiProperty({ example: $Enums.PrismaRoles.USER })
  role: $Enums.PrismaRoles
}

export class UpdateUserDTO {
  @ApiProperty({ example: 1 })
  @IsString()
  id: number

  @ApiProperty({ example: 'NotJoe' })
  @IsString()
  username: string

  @ApiProperty({ example: 'NotDoe' })
  @IsString()
  password: string

  @ApiProperty({ example: $Enums.PrismaRoles.ADMIN })
  role: $Enums.PrismaRoles
}
