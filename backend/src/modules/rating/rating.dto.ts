import { RecordGrade } from '@/enums'

export class RatingUpsertDTO {
  grade!: RecordGrade
}

export class GetUserRatingsQueryDTO {
  grade?: RecordGrade[]

  page?: number

  limit?: number
}
