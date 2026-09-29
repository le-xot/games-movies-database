import { ApiProperty } from '@nestjs/swagger'

export class HealthResponseDTO {
  @ApiProperty({ example: 'ok' })
  status!: string
}
