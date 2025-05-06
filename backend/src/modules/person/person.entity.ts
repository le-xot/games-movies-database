import { ApiProperty } from '@nestjs/swagger'
import { Person } from '@prisma/client'

export class PersonEntity implements Person {
  @ApiProperty()
  name: string

  @ApiProperty()
  id: number

  @ApiProperty()
  color: string

  @ApiProperty()
  createdAt: Date
}
