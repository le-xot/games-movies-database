import { ApiProperty } from '@nestjs/swagger'
import { IsString } from 'class-validator'

export class CallbackDto {
  @ApiProperty()
  @IsString()
  code: string

  @ApiProperty()
  @IsString()
  state: string
}
