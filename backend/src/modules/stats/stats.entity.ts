import { RecordGenre, RecordGrade, RecordStatus } from '@backend/enums'

export interface GenreCount {
  genre: RecordGenre
  count: number
}

export interface StatusCount {
  status: RecordStatus
  count: number
}

export interface GradeCount {
  grade: RecordGrade
  count: number
}

export interface GenreStatusCount {
  genre: RecordGenre
  status: RecordStatus
  count: number
}

export interface GenreGradeCount {
  genre: RecordGenre
  grade: RecordGrade
  count: number
}

export interface RecordsStats {
  total: number
  byGenre: GenreCount[]
  byStatus: StatusCount[]
  byGrade: GradeCount[]
  byFriendsGrade: GradeCount[]
  byGenreStatus: GenreStatusCount[]
  byGenreGrade: GenreGradeCount[]
  byFriendsGenreGrade: GenreGradeCount[]
}
