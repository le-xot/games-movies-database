import { RecordGenre, RecordType } from '@/enums/enums.names'
import { ApiProperty } from '@nestjs/swagger'
import { $Enums } from '@prisma/client'

export class QueueItemDto {
  @ApiProperty()
  title: string

  @ApiProperty({ nullable: true, default: 'John Doe', example: 'John Doe' })
  login: string

  @ApiProperty()
  link: string

  @ApiProperty()
  profileImageUrl: string

  @ApiProperty()
  posterUrl: string

  @ApiProperty()
  createdAt: string

  @ApiProperty({ enum: $Enums.RecordType, enumName: RecordType, nullable: true })
  type: $Enums.RecordType | null

  @ApiProperty({ enum: $Enums.RecordGenre, enumName: RecordGenre, nullable: true })
  genre: $Enums.RecordGenre | null
}

export class QueueDto {
  @ApiProperty({ type: QueueItemDto, isArray: true })
  games: QueueItemDto[]

  @ApiProperty({ type: QueueItemDto, isArray: true })
  videos: QueueItemDto[]
}
