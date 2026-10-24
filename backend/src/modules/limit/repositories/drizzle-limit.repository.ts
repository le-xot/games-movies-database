import { limits } from '@gmd/database/schema'
import { eq } from 'drizzle-orm'
import { DrizzleService } from '@/database/drizzle.service'
import { LimitType } from '@/enums'
import { LimitDomain } from '../entities/limit.entity'

export class DrizzleLimitRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async update(name: LimitType, value: number): Promise<LimitDomain> {
    const [limit] = await this.drizzle.db
      .update(limits)
      .set({ quantity: value })
      .where(eq(limits.name, name))
      .returning()
    if (!limit) throw new Error(`Limit ${name} not found`)
    return limit
  }
}
