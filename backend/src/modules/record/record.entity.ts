import { ApiProperty } from '@nestjs/swagger'
import { RecordGenre, RecordGrade, RecordStatus, RecordType } from '@prisma/client'

export class RecordEntity {
  @ApiProperty()
  id: number

  @ApiProperty()
  title: string

  @ApiProperty()
  link: string

  @ApiProperty()
  posterUrl: string

  @ApiProperty()
  status: RecordStatus | null

  @ApiProperty()
  type: RecordType | null

  @ApiProperty()
  genre: RecordGenre | null

  @ApiProperty()
  grade: RecordGrade | null

  @ApiProperty()
  episode: string | null

  @ApiProperty()
  userId: string | null

  @ApiProperty()
  createdAt: Date

  constructor(partial: Partial<RecordEntity>) {
    Object.assign(this, partial)
  }
}
