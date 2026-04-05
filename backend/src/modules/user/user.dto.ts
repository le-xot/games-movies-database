import { ApiProperty } from '@nestjs/swagger'
import { IsEnum, IsHexColor, IsOptional, IsString, IsUrl } from 'class-validator'
import { UserRole } from '@/enums'
import { UserRole as UserRoleName } from '@/enums/enums.names'

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
    example: UserRole.USER,
    enum: UserRole,
    enumName: UserRoleName,
    default: UserRole.USER,
    required: false,
  })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole

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
