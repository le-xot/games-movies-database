import { ApiProperty } from '@nestjs/swagger'
import { $Enums, Suggestion } from '@prisma/client'
import { GenresEnum, SuggestionsTypeEnum } from 'src/enums/enums.names'

export class SuggestionEntity implements Suggestion {
  @ApiProperty()
  id: number

  @ApiProperty()
  title: string

  @ApiProperty()
  userId: string

  @ApiProperty()
  link: string

  @ApiProperty({ enumName: SuggestionsTypeEnum, enum: $Enums.SuggestionsType })
  type: $Enums.SuggestionsType

  @ApiProperty({ nullable: true })
  posterUrl: string | null

  @ApiProperty({ nullable: true })
  grade: string | null

  @ApiProperty({ enumName: GenresEnum, enum: $Enums.PrismaGenres, nullable: true })
  genre: $Enums.PrismaGenres | null

  @ApiProperty()
  createdAt: Date
}
