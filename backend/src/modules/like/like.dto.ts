import { ApiProperty } from "@nestjs/swagger"
import { Type } from "class-transformer"
import { IsInt, IsNumber, IsOptional } from "class-validator"
import { LikeEntity } from "./like.entity"

export class LikeCreateDTO {
  @ApiProperty({ example: 1 })
  @IsNumber()
  recordId: number
}

export class GetLikesByIdDTO {
  @ApiProperty({ type: LikeEntity, isArray: true })
  likes: LikeEntity[]

  @ApiProperty({ example: 1 })
  @IsNumber()
  total: number
}

export class GetLikesDTO {
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
}
