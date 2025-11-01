import { PrismaService } from '@/database/prisma.service'
import { Injectable } from '@nestjs/common'
import { ChangeLimitDTO, LimitEntity } from './limit.dto'

@Injectable()
export class LimitService {
  constructor(private prisma: PrismaService) {}

  changeLimit(limitData: ChangeLimitDTO): Promise<LimitEntity> {
    return this.prisma.limit.update({
      where: { name: limitData.name },
      data: { quantity: limitData.quantity },
    })
  }
}
