import { ApiProperty } from '@nestjs/swagger'
import { $Enums, Video } from '@prisma/client'
import {
  GenresEnum,
  GradeEnum,
  StatusesEnum,
  TypesEnum,
} from '../../enums/enums.names'
import { PersonEntity } from '../person/person.entity'

export class VideoEntity implements Video {
  @ApiProperty()
  id: number

  @ApiProperty()
  title: string

  @ApiProperty({ type: PersonEntity })
  person: PersonEntity

  @ApiProperty()
  personId: number

  @ApiProperty({ enumName: TypesEnum, enum: $Enums.PrismaTypes })
  type: $Enums.PrismaTypes

  @ApiProperty({ enumName: StatusesEnum, enum: $Enums.PrismaStatuses })
  status: $Enums.PrismaStatuses

  @ApiProperty()
  episode: string

  @ApiProperty({ enumName: GenresEnum, enum: $Enums.PrismaGenres })
  genre: $Enums.PrismaGenres

  @ApiProperty({ enumName: GradeEnum, enum: $Enums.PrismaGrades })
  grade: $Enums.PrismaGrades

  @ApiProperty()
  createdAt: Date
}

export class GetAllVideosResponse {
  @ApiProperty({ type: VideoEntity, isArray: true })
  videos: VideoEntity[]

  @ApiProperty()
  total: number
}
