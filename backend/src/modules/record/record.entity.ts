import { ApiProperty } from '@nestjs/swagger'
import { RecordGenre, RecordGrade, RecordStatus, RecordType } from '@/enums'
import {
  RecordGenre as RecordGenreName,
  RecordGrade as RecordGradeName,
  RecordStatus as RecordStatusName,
  RecordType as RecordTypeName,
} from '@/enums/enums.names'
import { LikeEntity } from '@/modules/like/like.entity'
import { UserEntity } from '@/modules/user/user.entity'

export class RecordEntity {
  @ApiProperty()
  id: number

  @ApiProperty()
  title: string

  @ApiProperty()
  link: string

  @ApiProperty()
  posterUrl: string

  @ApiProperty({ enum: RecordStatus, enumName: RecordStatusName })
  status: RecordStatus | null

  @ApiProperty({ enum: RecordType, enumName: RecordTypeName })
  type: RecordType | null

  @ApiProperty({ enum: RecordGenre, enumName: RecordGenreName })
  genre: RecordGenre | null

  @ApiProperty({ enum: RecordGrade, enumName: RecordGradeName })
  grade: RecordGrade | null

  @ApiProperty()
  episode: string | null

  @ApiProperty()
  userId: string | null

  @ApiProperty({ type: UserEntity, required: false, nullable: true })
  user?: UserEntity | null

  @ApiProperty({ type: [LikeEntity], required: false, nullable: true })
  likes?: LikeEntity[] | null

  @ApiProperty()
  createdAt: Date

  constructor(partial: Partial<RecordEntity>) {
    Object.assign(this, partial)
  }
}
