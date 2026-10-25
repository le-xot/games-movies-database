import { DrizzleService } from '@backend/database/drizzle.service'
import { LimitType } from '@backend/enums'
import { limits } from '@gmd/database/schema'
import { eq } from 'drizzle-orm'
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
