import { ApiProperty } from '@nestjs/swagger'
import { IsEnum } from 'class-validator'
import { RecordGrade } from '@/enums'
import { RecordGrade as RecordGradeName } from '@/enums/enums.names'

export class RatingUpsertDTO {
  @ApiProperty({ example: RecordGrade.LIKE, enum: RecordGrade, enumName: RecordGradeName })
  @IsEnum(RecordGrade)
  grade!: RecordGrade
}
