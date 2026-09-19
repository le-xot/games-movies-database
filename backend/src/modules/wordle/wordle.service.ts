import crypto from 'node:crypto'
import { BadRequestException, Injectable } from '@nestjs/common'
import { WordleGameStatus } from '@/enums'
import {
  DrizzleWordleRepository,
  type WordleGameRecord,
} from '@/modules/wordle/repositories/drizzle-wordle.repository'
import { getMoscowDateKey, msUntilNextMoscowMidnight } from '@/modules/wordle/wordle.date'
import { WordleDictionary, normalizeWord } from '@/modules/wordle/wordle.dictionary'
import { WordleLeaderboardDTO, WordleStateDTO, WordleStatsDTO } from '@/modules/wordle/wordle.dto'
import { scoreGuess } from '@/modules/wordle/wordle.scoring'
import {
  MAX_ATTEMPTS,
  WORD_LENGTH,
  buildLeaderboard,
  computeWordleStats,
} from '@/modules/wordle/wordle.stats'

const WORD_PATTERN = /^[а-я]{5}$/

@Injectable()
export class WordleService {
  constructor(
    private readonly repository: DrizzleWordleRepository,
    private readonly dictionary: WordleDictionary,
  ) {}

  async getState(userId: string, now: Date = new Date()): Promise<WordleStateDTO> {
    const date = getMoscowDateKey(now)
    await this.repository.closeStaleGames(date)
    const game = await this.repository.findByUserAndDate(userId, date)
    return this.buildState(game, date, now)
  }

  async makeGuess(
    userId: string,
    rawWord: string,
    now: Date = new Date(),
  ): Promise<WordleStateDTO> {
    const date = getMoscowDateKey(now)
    await this.repository.closeStaleGames(date)

    const word = normalizeWord(rawWord)
    if (!WORD_PATTERN.test(word)) {
      throw new BadRequestException('Слово должно состоять из 5 русских букв')
    }
    if (!this.dictionary.isValidWord(word)) {
      throw new BadRequestException('Слово не найдено в словаре')
    }

    let game = await this.repository.findByUserAndDate(userId, date)
    if (!game) {
      game = await this.repository.createGame({
        id: crypto.randomUUID(),
        userId,
        date,
        answer: this.dictionary.getAnswerForDate(date),
      })
    }

    if (game.status !== WordleGameStatus.IN_PROGRESS) {
      throw new BadRequestException('Игра на сегодня уже завершена')
    }

    const updated = await this.repository.appendGuess(game.id, word)
    if (!updated) {
      throw new BadRequestException('Игра на сегодня уже завершена')
    }

    return this.buildState(updated, date, now)
  }

  async getStats(userId: string, now: Date = new Date()): Promise<WordleStatsDTO> {
    const today = getMoscowDateKey(now)
    await this.repository.closeStaleGames(today)
    const games = await this.repository.findFinishedByUser(userId)

    return computeWordleStats(
      games.map((game) => ({
        date: game.date,
        status: game.status,
        attempts: game.guesses.length,
      })),
      today,
    )
  }

  async getLeaderboard(now: Date = new Date()): Promise<WordleLeaderboardDTO> {
    const today = getMoscowDateKey(now)
    await this.repository.closeStaleGames(today)
    const rows = await this.repository.findFinishedWithUsers()

    const { entries, totalPlayers, totalGames } = buildLeaderboard(
      rows.map(({ game, user }) => ({
        userId: user.id,
        login: user.login,
        profileImageUrl: user.profileImageUrl,
        color: user.color,
        date: game.date,
        status: game.status,
        attempts: game.guesses.length,
      })),
      today,
    )
    const winsToday = await this.repository.countWinsByDate(today)

    return { entries, totalPlayers, totalGames, winsToday }
  }

  private buildState(game: WordleGameRecord | null, date: string, now: Date): WordleStateDTO {
    const guesses = game?.guesses ?? []
    const status = game?.status ?? WordleGameStatus.IN_PROGRESS
    const answer = game?.answer ?? null

    return {
      date,
      status,
      attempts: guesses.length,
      maxAttempts: MAX_ATTEMPTS,
      wordLength: WORD_LENGTH,
      guesses: guesses.map((word) => ({ word, states: scoreGuess(answer ?? '', word) })),
      answer: status === WordleGameStatus.IN_PROGRESS ? null : answer,
      msUntilNextWord: msUntilNextMoscowMidnight(now),
    }
  }
}
