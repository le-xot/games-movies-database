import { users, wordleGames } from '@gmd/database/schema'
import { Injectable } from '@nestjs/common'
import { and, asc, count, eq, lt, ne, sql } from 'drizzle-orm'
import { DrizzleService } from '@/database/drizzle.service'
import { WordleGameStatus } from '@/enums'
import { MAX_ATTEMPTS } from '@/modules/wordle/wordle.stats'

export interface WordleGameRecord {
  id: string
  userId: string
  date: string
  answer: string
  guesses: string[]
  status: WordleGameStatus
  createdAt: Date
}

export interface WordleGameWithUser {
  game: WordleGameRecord
  user: {
    id: string
    login: string
    profileImageUrl: string
    color: string
  }
}

@Injectable()
export class DrizzleWordleRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async closeStaleGames(today: string): Promise<number> {
    const closed = await this.drizzle.db
      .update(wordleGames)
      .set({ status: WordleGameStatus.LOST })
      .where(and(eq(wordleGames.status, WordleGameStatus.IN_PROGRESS), lt(wordleGames.date, today)))
      .returning({ id: wordleGames.id })

    return closed.length
  }

  async findByUserAndDate(userId: string, date: string): Promise<WordleGameRecord | null> {
    return (
      (await this.drizzle.db.query.wordleGames.findFirst({
        where: and(eq(wordleGames.userId, userId), eq(wordleGames.date, date)),
      })) ?? null
    )
  }

  async createGame(data: {
    id: string
    userId: string
    date: string
    answer: string
  }): Promise<WordleGameRecord> {
    const [created] = await this.drizzle.db
      .insert(wordleGames)
      .values(data)
      .onConflictDoNothing()
      .returning()
    if (created) return created

    const existing = await this.findByUserAndDate(data.userId, data.date)
    if (!existing) throw new Error('Не удалось создать партию')
    return existing
  }

  async appendGuess(id: string, word: string): Promise<WordleGameRecord | null> {
    const [updated] = await this.drizzle.db
      .update(wordleGames)
      .set({
        guesses: sql`${wordleGames.guesses} || jsonb_build_array(${word}::text)`,
        status: sql`CASE
          WHEN ${wordleGames.answer} = ${word} THEN 'WON'::"WordleGameStatus"
          WHEN jsonb_array_length(${wordleGames.guesses}) + 1 >= ${MAX_ATTEMPTS} THEN 'LOST'::"WordleGameStatus"
          ELSE 'IN_PROGRESS'::"WordleGameStatus"
        END`,
      })
      .where(and(eq(wordleGames.id, id), eq(wordleGames.status, WordleGameStatus.IN_PROGRESS)))
      .returning()
    return updated ?? null
  }

  async findFinishedByUser(userId: string): Promise<WordleGameRecord[]> {
    return await this.drizzle.db.query.wordleGames.findMany({
      where: and(
        eq(wordleGames.userId, userId),
        ne(wordleGames.status, WordleGameStatus.IN_PROGRESS),
      ),
      orderBy: asc(wordleGames.date),
    })
  }

  async findFinishedWithUsers(): Promise<WordleGameWithUser[]> {
    return await this.drizzle.db
      .select({
        game: wordleGames,
        user: {
          id: users.id,
          login: users.login,
          profileImageUrl: users.profileImageUrl,
          color: users.color,
        },
      })
      .from(wordleGames)
      .innerJoin(users, eq(wordleGames.userId, users.id))
      .where(ne(wordleGames.status, WordleGameStatus.IN_PROGRESS))
  }

  async findFinishedWithUsersByDate(date: string): Promise<WordleGameWithUser[]> {
    return await this.drizzle.db
      .select({
        game: wordleGames,
        user: {
          id: users.id,
          login: users.login,
          profileImageUrl: users.profileImageUrl,
          color: users.color,
        },
      })
      .from(wordleGames)
      .innerJoin(users, eq(wordleGames.userId, users.id))
      .where(and(ne(wordleGames.status, WordleGameStatus.IN_PROGRESS), eq(wordleGames.date, date)))
  }

  async countWinsByDate(date: string): Promise<number> {
    const [result] = await this.drizzle.db
      .select({ value: count() })
      .from(wordleGames)
      .where(and(eq(wordleGames.status, WordleGameStatus.WON), eq(wordleGames.date, date)))
    return result?.value ?? 0
  }
}
