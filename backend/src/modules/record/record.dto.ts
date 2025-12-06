import { RecordGenre, RecordGrade, RecordStatus, RecordType } from "@/enums/enums.names"
import { ApiProperty } from "@nestjs/swagger"
import { $Enums } from "@prisma/client"
import { Type } from "class-transformer"
import { IsEnum, IsInt, IsOptional, IsString, IsUrl } from "class-validator"
import { RecordEntity } from "./record.entity"

export class RecordCreateFromLinkDTO {
  @ApiProperty({ example: "https://example.com/record" })
  @IsUrl()
  link: string

  @ApiProperty({ example: $Enums.RecordStatus.QUEUE, enum: $Enums.RecordStatus, enumName: RecordStatus, required: false })
  @IsOptional()
  @IsEnum($Enums.RecordStatus)
  status?: $Enums.RecordStatus = $Enums.RecordStatus.QUEUE

  @ApiProperty({ example: $Enums.RecordType.WRITTEN, enum: $Enums.RecordType, enumName: RecordType, required: false })
  @IsOptional()
  @IsEnum($Enums.RecordType)
  type?: $Enums.RecordType = $Enums.RecordType.WRITTEN
}

export class RecordUpdateDTO {
  @ApiProperty({ example: $Enums.RecordStatus.PROGRESS, enum: $Enums.RecordStatus, enumName: RecordStatus, required: false })
  @IsOptional()
  @IsEnum($Enums.RecordStatus)
  status?: $Enums.RecordStatus

  @ApiProperty({ example: $Enums.RecordGrade.LIKE, enum: $Enums.RecordGrade, enumName: RecordGrade, required: false })
  @IsOptional()
  @IsEnum($Enums.RecordGrade)
  grade?: $Enums.RecordGrade

  @ApiProperty({ example: "S01E01", required: false })
  @IsOptional()
  @IsString()
  episode?: string

  @ApiProperty({ example: $Enums.RecordType.WRITTEN, enum: $Enums.RecordType, enumName: RecordType, required: false })
  @IsOptional()
  @IsEnum($Enums.RecordType)
  type?: $Enums.RecordType

  @ApiProperty({ example: "1", required: false })
  @IsOptional()
  @IsString()
  userId?: string
}

export class RecordGetDTO {
  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  id?: number

  @ApiProperty({ example: "My Record", required: false })
  @IsOptional()
  @IsString()
  title?: string

  @ApiProperty({ example: "https://example.com/record", required: false })
  @IsOptional()
  @IsUrl()
  link?: string

  @ApiProperty({ example: "https://example.com/poster.jpg", required: false })
  @IsOptional()
  @IsUrl()
  posterUrl?: string

  @ApiProperty({ example: $Enums.RecordStatus.PROGRESS, enum: $Enums.RecordStatus, enumName: RecordStatus, required: false })
  @IsOptional()
  @IsEnum($Enums.RecordStatus)
  status?: $Enums.RecordStatus

  @ApiProperty({ example: $Enums.RecordType.WRITTEN, enum: $Enums.RecordType, enumName: RecordType, required: false })
  @IsOptional()
  @IsEnum($Enums.RecordType)
  type?: $Enums.RecordType

  @ApiProperty({ example: $Enums.RecordGenre.GAME, enum: $Enums.RecordGenre, enumName: RecordGenre, required: false })
  @IsOptional()
  @IsEnum($Enums.RecordGenre)
  genre?: $Enums.RecordGenre

  @ApiProperty({ example: $Enums.RecordGrade.LIKE, enum: $Enums.RecordGrade, enumName: RecordGrade, required: false })
  @IsOptional()
  @IsEnum($Enums.RecordGrade)
  grade?: $Enums.RecordGrade

  @ApiProperty({ example: "S01E01", required: false })
  @IsOptional()
  @IsString()
  episode?: string

  @ApiProperty({ example: "1", required: false })
  @IsOptional()
  @IsString()
  userId?: string

  @ApiProperty({ example: "minecraft", required: false })
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

  @ApiProperty({ example: "id", required: false, enum: ["id", "title"] })
  @IsOptional()
  orderBy?: "id" | "title"

  @ApiProperty({ example: "asc", required: false, enum: ["asc", "desc"] })
  @IsOptional()
  direction?: "asc" | "desc"
}

export class GetAllRecordsDTO {
  @ApiProperty({ type: RecordEntity, isArray: true })
  records: RecordEntity[]

  @ApiProperty()
  total: number
}
