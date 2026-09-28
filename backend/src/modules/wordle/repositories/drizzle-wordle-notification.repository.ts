import { wordleGames, wordleNotificationSubscriptions } from '@gmd/database/schema'
import { Injectable } from '@nestjs/common'
import { and, asc, eq, inArray, ne } from 'drizzle-orm'
import { DrizzleService } from '@/database/drizzle.service'
import { WordleGameStatus } from '@/enums'
import type { WordleGameRecord } from '@/modules/wordle/repositories/drizzle-wordle.repository'
import type { SelectRow } from '@gmd/database'

export type WordleNotificationSubscriptionRecord = SelectRow<'wordleNotificationSubscriptions'>

export interface WordleNotificationFlags {
  morningEnabled?: boolean
  eveningEnabled?: boolean
}

@Injectable()
export class DrizzleWordleNotificationRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async findByUserId(userId: string): Promise<WordleNotificationSubscriptionRecord | null> {
    return (
      (await this.drizzle.db.query.wordleNotificationSubscriptions.findFirst({
        where: eq(wordleNotificationSubscriptions.userId, userId),
      })) ?? null
    )
  }

  async findByChatId(chatId: string): Promise<WordleNotificationSubscriptionRecord | null> {
    return (
      (await this.drizzle.db.query.wordleNotificationSubscriptions.findFirst({
        where: eq(wordleNotificationSubscriptions.chatId, chatId),
      })) ?? null
    )
  }

  async findAll(): Promise<WordleNotificationSubscriptionRecord[]> {
    return await this.drizzle.db.select().from(wordleNotificationSubscriptions)
  }

  async upsert(data: {
    userId: string
    chatId: string
    telegramUsername: string | null
  }): Promise<WordleNotificationSubscriptionRecord> {
    return await this.drizzle.db.transaction(async (tx) => {
      await tx
        .delete(wordleNotificationSubscriptions)
        .where(
          and(
            eq(wordleNotificationSubscriptions.chatId, data.chatId),
            ne(wordleNotificationSubscriptions.userId, data.userId),
          ),
        )

      const [updated] = await tx
        .update(wordleNotificationSubscriptions)
        .set({ chatId: data.chatId, telegramUsername: data.telegramUsername })
        .where(eq(wordleNotificationSubscriptions.userId, data.userId))
        .returning()
      if (updated) return updated

      const [created] = await tx.insert(wordleNotificationSubscriptions).values(data).returning()
      return created
    })
  }

  async updateFlags(
    userId: string,
    flags: WordleNotificationFlags,
  ): Promise<WordleNotificationSubscriptionRecord | null> {
    const values = Object.fromEntries(
      Object.entries(flags).filter(([, value]) => value !== undefined),
    )
    if (Object.keys(values).length === 0) return this.findByUserId(userId)

    const [updated] = await this.drizzle.db
      .update(wordleNotificationSubscriptions)
      .set(values)
      .where(eq(wordleNotificationSubscriptions.userId, userId))
      .returning()
    return updated ?? null
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.drizzle.db
      .delete(wordleNotificationSubscriptions)
      .where(eq(wordleNotificationSubscriptions.userId, userId))
  }

  async deleteByChatId(chatId: string): Promise<void> {
    await this.drizzle.db
      .delete(wordleNotificationSubscriptions)
      .where(eq(wordleNotificationSubscriptions.chatId, chatId))
  }

  async findUserIdsWonOnDate(date: string): Promise<string[]> {
    const rows = await this.drizzle.db
      .selectDistinct({ userId: wordleGames.userId })
      .from(wordleGames)
      .where(and(eq(wordleGames.date, date), eq(wordleGames.status, WordleGameStatus.WON)))
    return rows.map((row) => row.userId)
  }

  async findUserIdsFinishedOnDate(date: string): Promise<string[]> {
    const rows = await this.drizzle.db
      .selectDistinct({ userId: wordleGames.userId })
      .from(wordleGames)
      .where(and(eq(wordleGames.date, date), ne(wordleGames.status, WordleGameStatus.IN_PROGRESS)))
    return rows.map((row) => row.userId)
  }

  async findFinishedGamesByUserIds(userIds: string[]): Promise<WordleGameRecord[]> {
    if (userIds.length === 0) return []
    return await this.drizzle.db
      .select()
      .from(wordleGames)
      .where(
        and(
          inArray(wordleGames.userId, userIds),
          ne(wordleGames.status, WordleGameStatus.IN_PROGRESS),
        ),
      )
      .orderBy(asc(wordleGames.date))
  }
}
