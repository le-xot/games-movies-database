import { ApiProperty } from '@nestjs/swagger'
import { IsBoolean, IsOptional } from 'class-validator'

export class WordleNotificationsStatusDTO {
  @ApiProperty()
  available: boolean

  @ApiProperty()
  connected: boolean

  @ApiProperty({ type: String, nullable: true })
  telegramUsername: string | null

  @ApiProperty()
  morningEnabled: boolean

  @ApiProperty()
  eveningEnabled: boolean

  @ApiProperty({ example: '12:00' })
  morningTime: string

  @ApiProperty({ example: '20:00' })
  eveningTime: string
}

export class WordleNotificationsLinkDTO {
  @ApiProperty({ example: 'https://t.me/wordle_bot?start=abc' })
  url: string
}

export class WordleNotificationsUpdateDTO {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  morningEnabled?: boolean

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  eveningEnabled?: boolean
}

export class WordleNotificationsDeleteDTO {
  @ApiProperty()
  ok: boolean
}
