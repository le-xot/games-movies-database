import { ApiProperty } from '@nestjs/swagger'
import { $Enums, RecordGenre, RecordGrade, RecordStatus, RecordType } from '@prisma/client'
import { Type } from 'class-transformer'
import { IsEnum, IsInt, IsOptional, IsString, IsUrl } from 'class-validator'
import { RecordEntity } from './record.entity'

export class RecordUpsertDTO {
  @ApiProperty({ description: 'Title of the record', example: 'My Record' })
  @IsString()
  title: string

  @ApiProperty({ description: 'URL of the record', example: 'https://example.com/record' })
  @IsUrl()
  link: string

  @ApiProperty({ description: 'URL of the record poster', example: 'https://example.com/poster.jpg' })
  @IsUrl()
  posterUrl: string

  @ApiProperty({
    description: 'Status of the record',
    enum: RecordStatus,
    default: RecordStatus.QUEUE,
    required: false,
  })
  @IsEnum(RecordStatus)
  @IsOptional()
  status?: RecordStatus

  @ApiProperty({
    description: 'Type of the record',
    enum: RecordType,
    default: RecordType.HANDWRITTEN,
    required: false,
  })
  @IsEnum(RecordType)
  @IsOptional()
  type?: RecordType

  @ApiProperty({
    description: 'Genre of the record',
    enum: RecordGenre,
    required: false,
  })
  @IsEnum(RecordGenre)
  @IsOptional()
  genre?: RecordGenre

  @ApiProperty({
    description: 'Grade of the record',
    enum: RecordGrade,
    required: false,
  })
  @IsEnum(RecordGrade)
  @IsOptional()
  grade?: RecordGrade

  @ApiProperty({
    description: 'Episode identifier',
    example: 'S01E01',
    required: false,
  })
  @IsString()
  @IsOptional()
  episode?: string

  @ApiProperty({
    description: 'ID of the associated user',
    example: 'user123',
    required: false,
  })

  @IsString()
  @IsOptional()
  userId?: string
}

export class RecordGetDTO extends RecordEntity {
  @ApiProperty({ example: $Enums.RecordStatus.PROGRESS })
  @IsOptional()
  status: $Enums.RecordStatus

  @ApiProperty({ example: $Enums.RecordType.HANDWRITTEN })
  @IsOptional()
  type: $Enums.RecordType

  @ApiProperty({ example: $Enums.RecordGenre.GAME })
  @IsOptional()
  genre: $Enums.RecordGenre

  @ApiProperty({ example: $Enums.RecordGrade.LIKE })
  @IsOptional()
  grade: $Enums.RecordGrade

  @ApiProperty({ example: 1 })
  @IsOptional()
  @IsString()
  userId: string

  @ApiProperty({ example: 'minecraft', required: false })
  @IsOptional()
  @IsString()
  search?: string

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page?: number

  @ApiProperty({ example: 10, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  limit?: number

  @ApiProperty({ example: 'id', required: false })
  @IsOptional()
  orderBy?: 'id' | 'title'

  @ApiProperty({ example: 'asc', required: false })
  @IsOptional()
  direction?: 'asc' | 'desc'
}

export class GetAllRecordsDTO {
  @ApiProperty({ type: RecordEntity, isArray: true })
  records: RecordEntity[]

  @ApiProperty()
  total: number
}
