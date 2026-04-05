import { ApiProperty } from '@nestjs/swagger'
import { RecordGenre, RecordType } from '@/enums'
import { RecordGenre as RecordGenreName, RecordType as RecordTypeName } from '@/enums/enums.names'

export class QueueItemDto {
  @ApiProperty()
  title: string

  @ApiProperty({ nullable: true, default: 'John Doe', example: 'John Doe' })
  login: string

  @ApiProperty({ nullable: true })
  userId: string | null

  @ApiProperty()
  link: string

  @ApiProperty()
  profileImageUrl: string

  @ApiProperty()
  posterUrl: string

  @ApiProperty()
  createdAt: string

  @ApiProperty({ enum: RecordType, enumName: RecordTypeName, nullable: true })
  type: RecordType | null

  @ApiProperty({ enum: RecordGenre, enumName: RecordGenreName, nullable: true })
  genre: RecordGenre | null
}

export class QueueDto {
  @ApiProperty({ type: QueueItemDto, isArray: true })
  games: QueueItemDto[]

  @ApiProperty({ type: QueueItemDto, isArray: true })
  videos: QueueItemDto[]
}
