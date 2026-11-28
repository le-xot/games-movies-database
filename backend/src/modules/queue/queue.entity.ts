import { RecordGenre, RecordType } from '@backend/enums'

/** Очередь в домене: даты — ISO-строки, без локали и формата презентации. */
export interface QueueItem {
  title: string
  link: string
  posterUrl: string
  /** ISO-строка: форматирование для человека — дело слоя проводки. */
  createdAt: string
  type: RecordType | null
  genre: RecordGenre | null
}

export interface Queue {
  games: QueueItem[]
  videos: QueueItem[]
}
