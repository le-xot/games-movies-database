import { ApiProperty } from '@nestjs/swagger'

export class RecordsByGenreItem {
  @ApiProperty() genre: string
  @ApiProperty() count: number
}

export class GradeDistributionItem {
  @ApiProperty() grade: string
  @ApiProperty() count: number
}

export class ProfileStatsEntity {
  @ApiProperty() totalRecords: number
  @ApiProperty({ type: [RecordsByGenreItem] }) recordsByGenre: RecordsByGenreItem[]
  @ApiProperty({ type: [GradeDistributionItem] }) gradeDistribution: GradeDistributionItem[]
  @ApiProperty() totalLikesReceived: number
}
