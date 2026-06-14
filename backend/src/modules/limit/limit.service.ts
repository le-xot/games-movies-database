import { Injectable, Logger } from '@nestjs/common'
import { ChangeLimitDTO, LimitEntity } from '@/modules/limit/limit.dto'
import { LimitRepository } from './repositories/limit.repository'

@Injectable()
export class LimitService {
  private readonly logger = new Logger(LimitService.name)
  constructor(private readonly limitRepository: LimitRepository) {}

  changeLimit(limitData: ChangeLimitDTO): Promise<LimitEntity> {
    this.logger.log(`changeLimit name=${limitData.name} quantity=${limitData.quantity}`)
    return this.limitRepository.update(limitData.name, limitData.quantity) as Promise<LimitEntity>
  }
}
