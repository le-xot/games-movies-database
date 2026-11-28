import { LimitType } from '@backend/enums'

/** Входные данные изменения лимита. */
export interface ChangeLimitInput {
  name: LimitType
  quantity: number
}

/** Текущее значение лимита. */
export interface LimitSnapshot {
  name: LimitType
  quantity: number
}
