import { LikeEntity } from '@/modules/like/like.entity'

export class LikeCreateDTO {
  recordId!: number
}

export class GetLikesByIdDTO {
  likes!: LikeEntity[]

  total!: number
}

export class GetLikesDTO {
  page?: number

  limit?: number
}
