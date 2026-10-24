import { RecordGenre, RecordGrade, RecordStatus, RecordType } from '@/enums'
import { RecordEntity } from '@/modules/record/record.entity'

export class RecordCreateFromLinkDTO {
  link!: string

  status?: RecordStatus = RecordStatus.QUEUE

  type?: RecordType = RecordType.WRITTEN
}

export class RecordUpdateDTO {
  status?: RecordStatus

  grade?: RecordGrade | null

  episode?: string

  type?: RecordType
}

export class RecordUpdatePosterDTO {
  url!: string
}

export class RecordGetDTO {
  status?: RecordStatus[]

  type?: RecordType

  genre?: RecordGenre

  grade?: RecordGrade[]

  search?: string

  page?: number

  limit?: number

  orderBy?: 'id' | 'title'

  direction?: 'asc' | 'desc'
}

export class GetAllRecordsDTO {
  records!: RecordEntity[]

  total!: number
}
