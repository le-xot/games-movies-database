import { Injectable } from '@nestjs/common'
import { PrismaService } from '@/database/prisma.service'
import { LimitType } from '@/enums'
import { LimitDomain } from '../entities/limit.entity'
import { LimitRepository } from './limit.repository'

@Injectable()
export class PrismaLimitRepository extends LimitRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async update(name: LimitType, value: number): Promise<LimitDomain> {
    return await this.prisma.limit.update({
      where: { name },
      data: { quantity: value },
    })
  }
}
