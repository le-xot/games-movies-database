import { ApiProperty } from '@nestjs/swagger'
import { $Enums } from '@prisma/client'
import { IsOptional, IsString } from 'class-validator'

export class UserDTO {
  @ApiProperty({ example: 'NotJoe' })
  @IsString()
  login: string

  @ApiProperty({ example: 'NotDoe' })
  @IsString()
  id: string

  @ApiProperty({ example: $Enums.PrismaRoles.USER })
  @IsOptional()
  role: $Enums.PrismaRoles = $Enums.PrismaRoles.USER
}

export class UpsertUserDTO {
  @ApiProperty({ example: 'NotJoe' })
  @IsString()
  login: string

  @ApiProperty({ example: 'NotDoe' })
  @IsString()
  id: string

  @ApiProperty({ example: $Enums.PrismaRoles.USER })
  @IsOptional()
  role: $Enums.PrismaRoles = $Enums.PrismaRoles.USER
}
