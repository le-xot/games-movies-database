import { ApiProperty } from '@nestjs/swagger'
import { $Enums, Game } from '@prisma/client'
import { GradeEnum, StatusesEnum, TypesEnum } from '../../enums/enums.names'
import { PersonEntity } from '../person/person.entity'

export class GameEntity implements Game {
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

  @ApiProperty({ enumName: GradeEnum, enum: $Enums.PrismaGrades })
  grade: $Enums.PrismaGrades
}

export class GetAllGamesResponse {
  @ApiProperty({ type: GameEntity, isArray: true })
  games: GameEntity[]

  @ApiProperty()
  total: number
}
