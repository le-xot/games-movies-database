import { LimitType } from '@/enums'
import { LimitDomain } from '../entities/limit.entity'

export abstract class LimitRepository {
  abstract update(name: LimitType, value: number): Promise<LimitDomain>
}
