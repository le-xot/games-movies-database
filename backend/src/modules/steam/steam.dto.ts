import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsArray, IsEnum, IsInt, IsOptional, ValidateNested } from 'class-validator'
import { RecordGrade, RecordStatus } from '@/enums'
import {
  RecordGrade as RecordGradeName,
  RecordStatus as RecordStatusName,
} from '@/enums/enums.names'
import { RecordEntity } from '@/modules/record/record.entity'

export class SteamGameDto {
  @ApiProperty()
  appid: number

  @ApiProperty()
  name: string

  @ApiProperty({ description: 'Playtime in minutes' })
  playtime_forever: number

  @ApiProperty()
  header_image: string

  @ApiProperty()
  img_icon_url: string
}

export class SteamImportGameDto {
  @ApiProperty()
  @IsInt()
  appId: number

  @ApiProperty({ enum: RecordStatus, enumName: RecordStatusName })
  @IsEnum(RecordStatus)
  status: RecordStatus

  @ApiProperty({ enum: RecordGrade, enumName: RecordGradeName, required: false, nullable: true })
  @IsOptional()
  @IsEnum(RecordGrade)
  grade?: RecordGrade
}

export class SteamImportDTO {
  @ApiProperty({ type: [SteamImportGameDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SteamImportGameDto)
  games: SteamImportGameDto[]
}

export class SteamGamesResponseDTO {
  @ApiProperty({ type: [SteamGameDto] })
  games: SteamGameDto[]

  @ApiProperty({ type: [String] })
  existingAppIds: string[]
}

export class SteamImportResultDTO {
  @ApiProperty({ type: [RecordEntity] })
  created: RecordEntity[]

  @ApiProperty()
  failed: { appId: number; reason: string }[]
}
