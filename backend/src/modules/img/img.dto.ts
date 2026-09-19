import { ApiProperty } from '@nestjs/swagger'
import { IsEnum, IsOptional, IsString } from 'class-validator'

export enum ImgVariant {
  POSTER = 'poster',
  AVATAR = 'avatar',
}

export class GetImageQueryDTO {
  @ApiProperty({ description: 'Base64-encoded source image URL' })
  @IsString()
  urlEncoded: string

  @ApiProperty({ enum: ImgVariant, required: false, default: ImgVariant.POSTER })
  @IsOptional()
  @IsEnum(ImgVariant)
  variant?: ImgVariant
}
