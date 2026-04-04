import { ApiProperty } from '@nestjs/swagger'
import { IsString, IsUrl } from 'class-validator'

export class SuggestionCreateByTwirDTO {
  @ApiProperty({ example: '12345' })
  @IsString()
  userId: string

  @ApiProperty({ example: 'https://shikimori.one/animes/1943-paprika' })
  @IsString()
  @IsUrl()
  link: string
}
