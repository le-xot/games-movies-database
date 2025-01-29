import { ApiProperty } from '@nestjs/swagger'
import { $Enums } from '@prisma/client'
import { IsOptional, IsString } from 'class-validator'

export class UserDTO {
  @ApiProperty({ example: 'le_xot' })
  @IsString()
  login: string

  @ApiProperty({ example: '155644238' })
  @IsString()
  id: string

  @ApiProperty({ example: $Enums.PrismaRoles.USER })
  @IsOptional()
  role?: $Enums.PrismaRoles

  @ApiProperty({ example: 'le_xot' })
  @IsString()
  @IsOptional()
  profileImageUrl?: string
}

export class UpsertUserDTO {
  @ApiProperty({ example: 'le_xot' })
  @IsString()
  login: string

  @ApiProperty({ example: '155644238' })
  @IsString()
  id: string

  @ApiProperty({ example: $Enums.PrismaRoles.USER })
  @IsOptional()
  role?: $Enums.PrismaRoles

  @ApiProperty({ example: 'le_xot' })
  @IsString()
  @IsOptional()
  profileImageUrl?: string
}
