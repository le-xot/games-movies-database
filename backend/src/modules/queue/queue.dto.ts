import { RecordGenre, RecordType } from '@/enums'

export class QueueItemDto {
  title!: string

  link!: string

  posterUrl!: string

  createdAt!: string

  type!: RecordType | null

  genre!: RecordGenre | null
}

export class QueueDto {
  games!: QueueItemDto[]

  videos!: QueueItemDto[]
}
