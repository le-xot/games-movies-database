import crypto from 'node:crypto'
import { likes } from '@gmd/database/schema'
import { Injectable } from '@nestjs/common'
import { and, count, eq } from 'drizzle-orm'
import { DrizzleService } from '@/database/drizzle.service'
import { LikeDomain } from '../entities/like.entity'

@Injectable()
export class DrizzleLikeRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async findByUserAndRecord(userId: string, recordId: number): Promise<LikeDomain | null> {
    return (
      (await this.drizzle.db.query.likes.findFirst({
        where: and(eq(likes.userId, userId), eq(likes.recordId, recordId)),
      })) ?? null
    )
  }

  async create(userId: string, recordId: number): Promise<LikeDomain> {
    const [like] = await this.drizzle.db
      .insert(likes)
      .values({ id: crypto.randomUUID(), userId, recordId })
      .returning()
    return like
  }

  async deleteByUserAndRecord(userId: string, recordId: number): Promise<number> {
    const result = await this.drizzle.db
      .delete(likes)
      .where(and(eq(likes.userId, userId), eq(likes.recordId, recordId)))
    return result.rowCount ?? 0
  }

  async findByRecord(recordId: number): Promise<LikeDomain[]> {
    return await this.drizzle.db.query.likes.findMany({ where: eq(likes.recordId, recordId) })
  }

  async findByUser(userId: string): Promise<LikeDomain[]> {
    return await this.drizzle.db.query.likes.findMany({ where: eq(likes.userId, userId) })
  }

  async findMany(skip: number, take: number): Promise<LikeDomain[]> {
    return await this.drizzle.db.query.likes.findMany({ limit: take, offset: skip })
  }

  async countAll(): Promise<number> {
    const [result] = await this.drizzle.db.select({ value: count() }).from(likes)
    return result?.value ?? 0
  }
}
