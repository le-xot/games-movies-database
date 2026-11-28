import { Logger } from '@backend/utils/logger'
import { DrizzleLimitRepository } from './repositories/drizzle-limit.repository'
import type { ChangeLimitInput, LimitSnapshot } from '@backend/modules/limit/limit.entity'

export class LimitService {
  private readonly logger = new Logger(LimitService.name)
  constructor(private readonly limitRepository: DrizzleLimitRepository) {}

  changeLimit(limitData: ChangeLimitInput): Promise<LimitSnapshot> {
    this.logger.log(`changeLimit name=${limitData.name} quantity=${limitData.quantity}`)
    return this.limitRepository.update(limitData.name, limitData.quantity)
  }
}
