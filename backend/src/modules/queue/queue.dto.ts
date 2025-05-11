import { ApiProperty } from '@nestjs/swagger'
import { $Enums } from '@prisma/client'
import { RecordGenre } from 'src/enums/enums.names'

export class QueueItemDto {
  @ApiProperty()
  title: string

  @ApiProperty({ nullable: true })
  login: string | 'John Doe'

  @ApiProperty({ enum: $Enums.RecordGenre, enumName: RecordGenre, nullable: true })
  genre: $Enums.RecordGenre | null
}

export class QueueDto {
  @ApiProperty({ type: QueueItemDto, isArray: true })
  games: QueueItemDto[]

  @ApiProperty({ type: QueueItemDto, isArray: true })
  videos: QueueItemDto[]
}
