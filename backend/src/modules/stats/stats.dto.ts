import { ApiProperty } from '@nestjs/swagger'
import { RecordGenre, RecordGrade, RecordStatus } from '@/enums'
import {
  RecordGenre as RecordGenreName,
  RecordGrade as RecordGradeName,
  RecordStatus as RecordStatusName,
} from '@/enums/enums.names'

export class GenreCountDTO {
  @ApiProperty({ enum: RecordGenre, enumName: RecordGenreName })
  genre: RecordGenre

  @ApiProperty()
  count: number
}

export class StatusCountDTO {
  @ApiProperty({ enum: RecordStatus, enumName: RecordStatusName })
  status: RecordStatus

  @ApiProperty()
  count: number
}

export class GradeCountDTO {
  @ApiProperty({ enum: RecordGrade, enumName: RecordGradeName })
  grade: RecordGrade

  @ApiProperty()
  count: number
}

export class GenreStatusCountDTO {
  @ApiProperty({ enum: RecordGenre, enumName: RecordGenreName })
  genre: RecordGenre

  @ApiProperty({ enum: RecordStatus, enumName: RecordStatusName })
  status: RecordStatus

  @ApiProperty()
  count: number
}

export class GenreGradeCountDTO {
  @ApiProperty({ enum: RecordGenre, enumName: RecordGenreName })
  genre: RecordGenre

  @ApiProperty({ enum: RecordGrade, enumName: RecordGradeName })
  grade: RecordGrade

  @ApiProperty()
  count: number
}

export class RecordsStatsDTO {
  @ApiProperty()
  total: number

  @ApiProperty({ type: [GenreCountDTO] })
  byGenre: GenreCountDTO[]

  @ApiProperty({ type: [StatusCountDTO] })
  byStatus: StatusCountDTO[]

  @ApiProperty({ type: [GradeCountDTO] })
  byGrade: GradeCountDTO[]

  @ApiProperty({ type: [GenreStatusCountDTO] })
  byGenreStatus: GenreStatusCountDTO[]

  @ApiProperty({ type: [GenreGradeCountDTO] })
  byGenreGrade: GenreGradeCountDTO[]
}
