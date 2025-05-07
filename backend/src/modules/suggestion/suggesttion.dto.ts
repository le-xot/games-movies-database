import { ApiProperty } from '@nestjs/swagger'
import { $Enums } from '@prisma/client'
import { IsString } from 'class-validator'
import { UserDTO } from '../user/user.dto'

export class UserSuggestionDTO {
  @ApiProperty({ example: 'https://shikimori.one/animes/1943-paprika' })
  @IsString()
  link: string
}

export class SuggestionItemDto {
  @ApiProperty()
  id: number

  @ApiProperty()
  title: string

  @ApiProperty()
  link: string

  @ApiProperty()
  user: UserDTO

  @ApiProperty({ enum: $Enums.PrismaGenres, nullable: true })
  genre: $Enums.PrismaGenres | null

  @ApiProperty({ nullable: true })
  posterUrl: string | null

  @ApiProperty({ nullable: true })
  grade: string | null
}

export class SuggestionsDto {
  @ApiProperty({ type: SuggestionItemDto, isArray: true })
  suggestions: SuggestionItemDto[]
}
