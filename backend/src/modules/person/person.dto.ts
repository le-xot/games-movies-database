import { ApiProperty } from '@nestjs/swagger'
import { IsOptional, IsString } from 'class-validator'

export class CreatePersonDTO {
  @ApiProperty({ example: 'le_xot' })
  @IsOptional()
  @IsString()
  name?: string

  @ApiProperty({ example: '#333333', required: false })
  @IsOptional()
  @IsString()
  color?: string
}

export class PatchPersonDTO {
  @ApiProperty({ example: 'le_xot', required: false })
  @IsOptional()
  @IsString()
  name?: string

  @ApiProperty({ example: '#333333', required: false })
  @IsOptional()
  @IsString()
  color?: string
}
