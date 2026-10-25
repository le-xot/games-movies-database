import { ChangeLimitDTO, LimitEntity } from '@backend/modules/limit/limit.dto'
import { Logger } from '@backend/utils/logger'
import { DrizzleLimitRepository } from './repositories/drizzle-limit.repository'

export class LimitService {
  private readonly logger = new Logger(LimitService.name)
  constructor(private readonly limitRepository: DrizzleLimitRepository) {}

  changeLimit(limitData: ChangeLimitDTO): Promise<LimitEntity> {
    this.logger.log(`changeLimit name=${limitData.name} quantity=${limitData.quantity}`)
    return this.limitRepository.update(limitData.name, limitData.quantity)
  }
}
