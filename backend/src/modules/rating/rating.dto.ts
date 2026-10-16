import { ApiProperty } from '@nestjs/swagger'
import { Transform, Type } from 'class-transformer'
import { IsArray, IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator'
import { RecordGrade } from '@/enums'
import { RecordGrade as RecordGradeName } from '@/enums/enums.names'

export class RatingUpsertDTO {
  @ApiProperty({ example: RecordGrade.LIKE, enum: RecordGrade, enumName: RecordGradeName })
  @IsEnum(RecordGrade)
  grade!: RecordGrade
}

export class GetUserRatingsQueryDTO {
  @ApiProperty({
    example: RecordGrade.LIKE,
    enum: RecordGrade,
    enumName: RecordGradeName,
    required: false,
    isArray: true,
  })
  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  @IsArray()
  @IsEnum(RecordGrade, { each: true })
  grade?: RecordGrade[]

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10_000)
  page?: number

  @ApiProperty({ example: 10, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number
}
