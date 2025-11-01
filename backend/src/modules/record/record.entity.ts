import { ApiProperty } from '@nestjs/swagger'
import { RecordGenre, RecordGrade, RecordStatus, RecordType } from '@prisma/client'
import { UserEntity } from '../user/user.entity'

export class RecordEntity {
  @ApiProperty()
  id: number

  @ApiProperty()
  title: string

  @ApiProperty()
  link: string

  @ApiProperty()
  posterUrl: string

  @ApiProperty({ enum: RecordStatus })
  status: RecordStatus | null

  @ApiProperty({ enum: RecordType })
  type: RecordType | null

  @ApiProperty({ enum: RecordGenre })
  genre: RecordGenre | null

  @ApiProperty({ enum: RecordGrade })
  grade: RecordGrade | null

  @ApiProperty()
  episode: string | null

  @ApiProperty()
  userId: string | null

  @ApiProperty({ type: UserEntity, required: false, nullable: true })
  user?: UserEntity | null

  @ApiProperty()
  createdAt: Date

  constructor(partial: Partial<RecordEntity>) {
    Object.assign(this, partial)
  }
}
