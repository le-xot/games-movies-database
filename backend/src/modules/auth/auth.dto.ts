import { ApiProperty } from '@nestjs/swagger'
import { IsString } from 'class-validator'

export class LoginDTO {
  @ApiProperty({ example: 'admin' })
  @IsString()
  username: string

  @ApiProperty({ example: 'secret' })
  @IsString()
  password: string
}
