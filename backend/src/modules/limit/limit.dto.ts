import { ApiProperty } from '@nestjs/swagger'
import { IsEnum, IsInt, IsNotEmpty, Min } from 'class-validator'
import { LimitType } from '@/enums'
import { LimitType as LimitTypeName } from '@/enums/enums.names'

export class ChangeLimitDTO {
  @ApiProperty({ enum: LimitType, enumName: LimitTypeName })
  @IsEnum(LimitType)
  @IsNotEmpty()
  name: LimitType

  @ApiProperty({ example: 5, description: 'Limit quantity' })
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  quantity: number
}

export class LimitEntity {
  @ApiProperty({ enum: LimitType, enumName: LimitTypeName })
  name: LimitType

  @ApiProperty()
  quantity: number
}
