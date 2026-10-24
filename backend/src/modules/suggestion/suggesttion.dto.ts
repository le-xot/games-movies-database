import { RecordGenre } from '@/enums'

export class UserSuggestionDTO {
  link!: string
}

export class UserSuggestionResponseDTO {
  title!: string

  genre!: RecordGenre
}
