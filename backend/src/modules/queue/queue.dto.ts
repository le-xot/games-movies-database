import { ApiProperty } from '@nestjs/swagger'
import { $Enums } from '@prisma/client'

export class QueueItemDto {
  @ApiProperty()
  title: string

  @ApiProperty()
  type: QueueType

  @ApiProperty()
  personName: string

  @ApiProperty({ enum: $Enums.PrismaGenres, nullable: true })
  genre: $Enums.PrismaGenres | null
}

export enum QueueType {
  VIDEO = 'VIDEO',
  GAME = 'GAME',
}

export class QueueDto {
  @ApiProperty({ type: QueueItemDto, isArray: true })
  games: QueueItemDto[]

  @ApiProperty({ type: QueueItemDto, isArray: true })
  videos: QueueItemDto[]
}
