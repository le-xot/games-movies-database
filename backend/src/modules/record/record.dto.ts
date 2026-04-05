import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsEnum, IsInt, IsOptional, IsString, IsUrl } from 'class-validator'
import { RecordGenre, RecordGrade, RecordStatus, RecordType } from '@/enums'
import {
  RecordGenre as RecordGenreName,
  RecordGrade as RecordGradeName,
  RecordStatus as RecordStatusName,
  RecordType as RecordTypeName,
} from '@/enums/enums.names'
import { RecordEntity } from '@/modules/record/record.entity'

export class RecordCreateFromLinkDTO {
  @ApiProperty({ example: 'https://example.com/record' })
  @IsUrl()
  link: string

  @ApiProperty({
    example: RecordStatus.QUEUE,
    enum: RecordStatus,
    enumName: RecordStatusName,
    required: false,
  })
  @IsOptional()
  @IsEnum(RecordStatus)
  status?: RecordStatus = RecordStatus.QUEUE

  @ApiProperty({
    example: RecordType.WRITTEN,
    enum: RecordType,
    enumName: RecordTypeName,
    required: false,
  })
  @IsOptional()
  @IsEnum(RecordType)
  type?: RecordType = RecordType.WRITTEN
}

export class RecordUpdateDTO {
  @ApiProperty({
    example: RecordStatus.PROGRESS,
    enum: RecordStatus,
    enumName: RecordStatusName,
    required: false,
  })
  @IsOptional()
  @IsEnum(RecordStatus)
  status?: RecordStatus

  @ApiProperty({
    example: RecordGrade.LIKE,
    enum: RecordGrade,
    enumName: RecordGradeName,
    required: false,
  })
  @IsOptional()
  @IsEnum(RecordGrade)
  grade?: RecordGrade

  @ApiProperty({ example: 'S01E01', required: false })
  @IsOptional()
  @IsString()
  episode?: string

  @ApiProperty({
    example: RecordType.WRITTEN,
    enum: RecordType,
    enumName: RecordTypeName,
    required: false,
  })
  @IsOptional()
  @IsEnum(RecordType)
  type?: RecordType

  @ApiProperty({ example: '1', required: false })
  @IsOptional()
  @IsString()
  userId?: string
}

export class RecordGetDTO {
  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  id?: number

  @ApiProperty({ example: 'My Record', required: false })
  @IsOptional()
  @IsString()
  title?: string

  @ApiProperty({ example: 'https://example.com/record', required: false })
  @IsOptional()
  @IsUrl()
  link?: string

  @ApiProperty({ example: 'https://example.com/poster.jpg', required: false })
  @IsOptional()
  @IsUrl()
  posterUrl?: string

  @ApiProperty({
    example: RecordStatus.PROGRESS,
    enum: RecordStatus,
    enumName: RecordStatusName,
    required: false,
  })
  @IsOptional()
  @IsEnum(RecordStatus)
  status?: RecordStatus

  @ApiProperty({
    example: RecordType.WRITTEN,
    enum: RecordType,
    enumName: RecordTypeName,
    required: false,
  })
  @IsOptional()
  @IsEnum(RecordType)
  type?: RecordType

  @ApiProperty({
    example: RecordGenre.GAME,
    enum: RecordGenre,
    enumName: RecordGenreName,
    required: false,
  })
  @IsOptional()
  @IsEnum(RecordGenre)
  genre?: RecordGenre

  @ApiProperty({
    example: RecordGrade.LIKE,
    enum: RecordGrade,
    enumName: RecordGradeName,
    required: false,
  })
  @IsOptional()
  @IsEnum(RecordGrade)
  grade?: RecordGrade

  @ApiProperty({ example: 'S01E01', required: false })
  @IsOptional()
  @IsString()
  episode?: string

  @ApiProperty({ example: '1', required: false })
  @IsOptional()
  @IsString()
  userId?: string

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

  @ApiProperty({ example: 'id', required: false, enum: ['id', 'title'] })
  @IsOptional()
  orderBy?: 'id' | 'title'

  @ApiProperty({ example: 'asc', required: false, enum: ['asc', 'desc'] })
  @IsOptional()
  direction?: 'asc' | 'desc'
}

export class GetAllRecordsDTO {
  @ApiProperty({ type: RecordEntity, isArray: true })
  records: RecordEntity[]

  @ApiProperty()
  total: number
}
