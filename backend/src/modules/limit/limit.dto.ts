import { ApiProperty } from '@nestjs/swagger'
import { $Enums } from '@prisma/client'
import { IsEnum, IsInt, IsNotEmpty, Min } from 'class-validator'
import { LimitTypeEnum } from 'src/enums/enums.names'

export class ChangeLimitDTO {
  @ApiProperty({ enum: $Enums.LimitType, enumName: LimitTypeEnum })
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
  @ApiProperty({ enum: $Enums.LimitType, enumName: LimitTypeEnum })
  name: $Enums.LimitType

  @ApiProperty()
  quantity: number
}
