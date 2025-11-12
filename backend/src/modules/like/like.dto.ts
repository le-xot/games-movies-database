import { ApiProperty } from '@nestjs/swagger'
import { IsNumber } from 'class-validator'
import { LikeEntity } from './like.entity'

export class LikeCreateDTO {
  @ApiProperty({ example: 1 })
  @IsNumber()
  recordId: number
}

export class GetLikesByIdDTO {
  @ApiProperty({ type: LikeEntity, isArray: true })
  likes: LikeEntity[]

  @ApiProperty({ example: 1 })
  @IsNumber()
  total: number
}
