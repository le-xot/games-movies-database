import { UserEntity } from '@backend/modules/user/user.entity'

export class LikeEntity {
  id!: string

  userId!: string

  recordId!: number

  user?: UserEntity | null

  createdAt!: Date

  constructor(partial: Partial<LikeEntity>) {
    Object.assign(this, partial)
  }
}
