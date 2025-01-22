import { ApiProperty } from '@nestjs/swagger'
import { IsString } from 'class-validator'

export class CreatePersonDTO {
  @ApiProperty({ example: 'le_xot' })
  @IsString()
  name: string

  @ApiProperty({ example: '#333333', required: false })
  @IsString()
  color?: string
}

export class PatchPersonDTO {
  @ApiProperty({ example: 'le_xot', required: false })
  @IsString()
  name?: string

  @ApiProperty({ example: '#333333', required: false })
  @IsString()
  color?: string
}
