import { ApiProperty } from '@nestjs/swagger'
import { $Enums } from '@prisma/client'
import { IsEnum, IsInt, IsNotEmpty, Min } from 'class-validator'
import { LimitType } from 'src/enums/enums.names'

export class ChangeLimitDTO {
  @ApiProperty({ enum: $Enums.LimitType, enumName: LimitType })
  @IsEnum($Enums.LimitType)
  @IsNotEmpty()
  name: $Enums.LimitType

  @ApiProperty({ example: 5, description: 'Limit quantity' })
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  quantity: number
}

export class LimitEntity {
  @ApiProperty({ enum: $Enums.LimitType, enumName: LimitType })
  name: $Enums.LimitType

  @ApiProperty()
  quantity: number
}
