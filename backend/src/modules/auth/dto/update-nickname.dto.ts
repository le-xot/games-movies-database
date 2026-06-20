import { ApiProperty } from '@nestjs/swagger'
import { IsString, MaxLength, MinLength } from 'class-validator'

export class UpdateNicknameDTO {
  @ApiProperty({ description: 'New display name', example: 'cool_user' })
  @IsString()
  @MinLength(2)
  @MaxLength(32)
  login: string
}
