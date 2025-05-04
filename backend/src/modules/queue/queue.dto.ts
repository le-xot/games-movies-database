import { ApiProperty } from '@nestjs/swagger'
import { $Enums } from '@prisma/client'

export class QueueItemDto {
  @ApiProperty()
  title: string

  @ApiProperty()
  type: QueueType

  @ApiProperty({ nullable: true })
  personName: string | 'John Doe'

  @ApiProperty({ enum: $Enums.PrismaGenres, nullable: true })
  genre: $Enums.PrismaGenres | null
}

export enum QueueType {
  // eslint-disable-next-line no-unused-vars
  VIDEO = 'VIDEO',
  // eslint-disable-next-line no-unused-vars
  GAME = 'GAME',
}

export class QueueDto {
  @ApiProperty({ type: QueueItemDto, isArray: true })
  games: QueueItemDto[]

  @ApiProperty({ type: QueueItemDto, isArray: true })
  videos: QueueItemDto[]
}
