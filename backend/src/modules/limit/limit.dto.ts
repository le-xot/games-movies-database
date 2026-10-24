import { LimitType } from '@/enums'

export class ChangeLimitDTO {
  name!: LimitType

  quantity!: number
}

export class LimitEntity {
  name!: LimitType

  quantity!: number
}
