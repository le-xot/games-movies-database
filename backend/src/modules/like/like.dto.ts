import { ApiProperty } from '@nestjs/swagger'
import { IsNumber } from 'class-validator'

export class LikeCreateDTO {
  @ApiProperty({ example: 1 })
  @IsNumber()
  recordId: number
}
