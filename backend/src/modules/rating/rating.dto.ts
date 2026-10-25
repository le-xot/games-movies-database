import { RecordGrade } from '@backend/enums'

export class RatingUpsertDTO {
  grade!: RecordGrade
}

export class GetUserRatingsQueryDTO {
  grade?: RecordGrade[]

  page?: number

  limit?: number
}
