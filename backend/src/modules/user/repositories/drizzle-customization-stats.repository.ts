import { DrizzleService } from '@backend/database/drizzle.service'
import { WordleGameStatus } from '@backend/enums'
import { getMoscowDateKey } from '@backend/modules/wordle/wordle.date'
import { computeWordleStats } from '@backend/modules/wordle/wordle.stats'
import { recordRatings, wordleGames } from '@gmd/database/schema'
import { and, count, eq, ne } from 'drizzle-orm'

/**
 * Данные для чекпоинтов косметики: сколько оценок поставил пользователь и
 * какая у него максимальная серия побед в Wordle. Серия считается по всем
 * завершённым партиям, `maxStreak` от «сегодня» не зависит.
 */
export class DrizzleCustomizationStatsRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async countRatings(userId: string): Promise<number> {
    const [result] = await this.drizzle.db
      .select({ value: count() })
      .from(recordRatings)
      .where(eq(recordRatings.userId, userId))

    return result?.value ?? 0
  }

  async maxWordleStreak(userId: string): Promise<number> {
    const games = await this.drizzle.db
      .select({
        date: wordleGames.date,
        status: wordleGames.status,
        guesses: wordleGames.guesses,
      })
      .from(wordleGames)
      .where(
        and(eq(wordleGames.userId, userId), ne(wordleGames.status, WordleGameStatus.IN_PROGRESS)),
      )

    return computeWordleStats(
      games.map((game) => ({
        date: game.date,
        status: game.status,
        attempts: game.guesses.length,
      })),
      getMoscowDateKey(new Date()),
    ).maxStreak
  }
}
