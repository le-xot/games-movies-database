import { ApiProperty } from '@nestjs/swagger'
import { $Enums } from '@prisma/client'
import { Type } from 'class-transformer'
import { IsInt, IsOptional, IsString } from 'class-validator'

export class CreateVideoDTO {
  @ApiProperty({ example: 'Мадагаскар', required: false })
  @IsOptional()
  @IsString()
  title?: string

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  personId?: number

  @ApiProperty({ example: $Enums.PrismaTypes.FREE, required: false })
  @IsOptional()
  type?: $Enums.PrismaTypes

  @ApiProperty({ example: $Enums.PrismaStatuses.PROGRESS, required: false })
  @IsOptional()
  status?: $Enums.PrismaStatuses

  @ApiProperty({ example: $Enums.PrismaGenres.CARTOON, required: false })
  @IsOptional()
  genre?: $Enums.PrismaGenres

  @ApiProperty({ example: $Enums.PrismaGrades.DISLIKE, required: false })
  @IsOptional()
  grade?: $Enums.PrismaGrades
}

export class PatchVideoDTO {
  @ApiProperty({ example: 'Боб строитель', required: false })
  @IsOptional()
  @IsString()
  title?: string

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  personId?: number

  @ApiProperty({ example: $Enums.PrismaTypes.FREE, required: false })
  @IsOptional()
  type?: $Enums.PrismaTypes

  @ApiProperty({ example: $Enums.PrismaStatuses.DONE, required: false })
  @IsOptional()
  status?: $Enums.PrismaStatuses

  @ApiProperty({ example: $Enums.PrismaGenres.MOVIE, required: false })
  @IsOptional()
  genre?: $Enums.PrismaGenres

  @ApiProperty({ example: $Enums.PrismaGrades.DISLIKE, required: false })
  @IsOptional()
  grade?: $Enums.PrismaGrades
}

export class GetVideoDTO {
  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page?: number

  @ApiProperty({ example: 10, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  limit?: number

  @ApiProperty({ example: 'Мадагаскар', required: false })
  @IsOptional()
  @IsString()
  title?: string

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  personId?: number

  @ApiProperty({ example: $Enums.PrismaTypes.FREE, required: false })
  @IsOptional()
  type?: $Enums.PrismaTypes

  @ApiProperty({ example: $Enums.PrismaStatuses.PROGRESS, required: false })
  @IsOptional()
  status?: $Enums.PrismaStatuses

  @ApiProperty({ example: $Enums.PrismaGenres.CARTOON, required: false })
  @IsOptional()
  genre?: $Enums.PrismaGenres

  @ApiProperty({ example: $Enums.PrismaGrades.LIKE, required: false })
  @IsOptional()
  grade?: $Enums.PrismaGrades
}
