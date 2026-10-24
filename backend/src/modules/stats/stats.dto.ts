import { RecordGenre, RecordGrade, RecordStatus } from '@backend/enums'

export class GenreCountDTO {
  genre!: RecordGenre

  count!: number
}

export class StatusCountDTO {
  status!: RecordStatus

  count!: number
}

export class GradeCountDTO {
  grade!: RecordGrade

  count!: number
}

export class GenreStatusCountDTO {
  genre!: RecordGenre

  status!: RecordStatus

  count!: number
}

export class GenreGradeCountDTO {
  genre!: RecordGenre

  grade!: RecordGrade

  count!: number
}

export class RecordsStatsDTO {
  total!: number

  byGenre!: GenreCountDTO[]

  byStatus!: StatusCountDTO[]

  byGrade!: GradeCountDTO[]

  byFriendsGrade!: GradeCountDTO[]

  byGenreStatus!: GenreStatusCountDTO[]

  byGenreGrade!: GenreGradeCountDTO[]

  byFriendsGenreGrade!: GenreGradeCountDTO[]
}
