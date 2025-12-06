import { ApiProperty } from "@nestjs/swagger"
import { IsString } from "class-validator"

export class UserSuggestionDTO {
  @ApiProperty({ example: "https://shikimori.one/animes/1943-paprika" })
  @IsString()
  link: string
}
