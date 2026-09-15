import { Injectable, Logger } from '@nestjs/common'
import { ChangeLimitDTO, LimitEntity } from '@/modules/limit/limit.dto'
import { DrizzleLimitRepository } from './repositories/drizzle-limit.repository'

@Injectable()
export class LimitService {
  private readonly logger = new Logger(LimitService.name)
  constructor(private readonly limitRepository: DrizzleLimitRepository) {}

  changeLimit(limitData: ChangeLimitDTO): Promise<LimitEntity> {
    this.logger.log(`changeLimit name=${limitData.name} quantity=${limitData.quantity}`)
    return this.limitRepository.update(limitData.name, limitData.quantity) as Promise<LimitEntity>
  }
}
