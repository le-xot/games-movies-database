import { PrismaService } from '@/database/prisma.service'
import { Injectable, Logger } from '@nestjs/common'
import { ChangeLimitDTO, LimitEntity } from './limit.dto'

@Injectable()
export class LimitService {
  private readonly logger = new Logger(LimitService.name)
  constructor(private prisma: PrismaService) {}

  changeLimit(limitData: ChangeLimitDTO): Promise<LimitEntity> {
    this.logger.log(`changeLimit name=${limitData.name} quantity=${limitData.quantity}`)
    return this.prisma.limit.update({
      where: { name: limitData.name },
      data: { quantity: limitData.quantity },
    })
  }
}
