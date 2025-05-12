import { ApiProperty } from '@nestjs/swagger'
import { $Enums } from '@prisma/client'
import { IsEnum, IsHexColor, IsOptional, IsString, IsUrl } from 'class-validator'
import { UserRole } from 'src/enums/enums.names'

export class UserCreateByLoginDTO {
  @ApiProperty({ description: 'Unique login of the user', example: 'john_doe' })
  @IsString()
  login: string
}

export class UserUpdateDTO {
  @ApiProperty({ example: 'john_doe', required: false })
  @IsOptional()
  @IsString()
  login?: string

  @ApiProperty({
    example: $Enums.UserRole.USER,
    enum: $Enums.UserRole,
    enumName: UserRole,
    default: $Enums.UserRole.USER,
    required: false,
  })
  @IsEnum($Enums.UserRole)
  @IsOptional()
  role?: $Enums.UserRole

  @ApiProperty({ example: 'https://example.com/image.jpg', required: false })
  @IsOptional()
  @IsUrl()
  profileImageUrl?: string

  @ApiProperty({
    example: '#333333',
    required: false,
  })
  @IsHexColor()
  @IsOptional()
  color?: string
}
