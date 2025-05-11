import { ApiProperty } from '@nestjs/swagger'
import { UserRole } from '@prisma/client'
import { IsEnum, IsHexColor, IsOptional, IsString, IsUrl } from 'class-validator'

export class UserUpsertDto {
  @ApiProperty({ description: 'Unique login of the user', example: 'john_doe' })
  @IsString()
  login: string

  @ApiProperty({
    description: 'Role of the user',
    enum: UserRole,
    default: UserRole.USER,
    required: false,
  })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole

  @ApiProperty({ description: 'URL of the user profile image', example: 'https://example.com/image.jpg' })
  @IsUrl()
  profileImageUrl: string

  @ApiProperty({
    description: 'Hex color code for user profile',
    example: '#333333',
    required: false,
  })
  @IsHexColor()
  @IsOptional()
  color?: string
}
