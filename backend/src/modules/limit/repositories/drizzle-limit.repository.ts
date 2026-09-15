import { limits } from '@gmd/database/schema'
import { Injectable } from '@nestjs/common'
import { eq } from 'drizzle-orm'
import { DrizzleService } from '@/database/drizzle.service'
import { LimitType } from '@/enums'
import { LimitDomain } from '../entities/limit.entity'
import { LimitRepository } from './limit.repository'

@Injectable()
export class DrizzleLimitRepository extends LimitRepository {
  constructor(private readonly drizzle: DrizzleService) {
    super()
  }

  async update(name: LimitType, value: number): Promise<LimitDomain> {
    const [limit] = await this.drizzle.db
      .update(limits)
      .set({ quantity: value })
      .where(eq(limits.name, name))
      .returning()
    return limit
  }
}
