import { ApiProperty } from '@nestjs/swagger'
import { IsString } from 'class-validator'
import { RecordGenre } from '@/enums'
import { RecordGenre as RecordGenreName } from '@/enums/enums.names'

export class UserSuggestionDTO {
  @ApiProperty({ example: 'https://shikimori.one/animes/1943-paprika' })
  @IsString()
  link: string
}

export class UserSuggestionResponseDTO {
  @ApiProperty()
  title: string

  @ApiProperty({ enum: RecordGenre, enumName: RecordGenreName })
  genre: RecordGenre
}
