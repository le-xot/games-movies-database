import { RecordGenre, RecordGrade, RecordStatus, RecordType } from '@/enums/enums.names'
import { LikeEntity } from '@/modules/like/like.entity'
import { ApiProperty } from '@nestjs/swagger'
import { $Enums } from '@prisma/client'
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

  @ApiProperty({ enum: $Enums.RecordStatus, enumName: RecordStatus })
  status: $Enums.RecordStatus | null

  @ApiProperty({ enum: $Enums.RecordType, enumName: RecordType })
  type: $Enums.RecordType | null

  @ApiProperty({ enum: $Enums.RecordGenre, enumName: RecordGenre })
  genre: $Enums.RecordGenre | null

  @ApiProperty({ enum: $Enums.RecordGrade, enumName: RecordGrade })
  grade: $Enums.RecordGrade | null

  @ApiProperty()
  episode: string | null

  @ApiProperty()
  userId: string | null

  @ApiProperty({ type: UserEntity, required: false, nullable: true })
  user?: UserEntity | null

  @ApiProperty ({ type: [LikeEntity], required: false, nullable: true })
  likes?: LikeEntity[] | null

  @ApiProperty()
  createdAt: Date

  constructor(partial: Partial<RecordEntity>) {
    Object.assign(this, partial)
  }
}
