import crypto from 'node:crypto'
import {
  BadRequestException,
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common'
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter'
import { WordleGameStatus } from '@/enums'
import { WsEvents, type UpdateWordlePayload } from '@/modules/websocket/websocket.events'
import {
  DrizzleWordleRepository,
  type WordleGameRecord,
} from '@/modules/wordle/repositories/drizzle-wordle.repository'
import { WordleLeaderboardCache } from '@/modules/wordle/wordle-leaderboard.cache'
import { getMoscowDateKey, msUntilNextMoscowMidnight } from '@/modules/wordle/wordle.date'
import { WordleDictionary, normalizeWord } from '@/modules/wordle/wordle.dictionary'
import { WordleLeaderboardDTO, WordleStateDTO, WordleStatsDTO } from '@/modules/wordle/wordle.dto'
import { scoreGuess } from '@/modules/wordle/wordle.scoring'
import {
  MAX_ATTEMPTS,
  WORD_LENGTH,
  buildDailyLeaderboard,
  buildLeaderboard,
  computeWordleStats,
} from '@/modules/wordle/wordle.stats'

const WORD_PATTERN = /^[а-я]{5}$/
const STALE_CLEANUP_INTERVAL_MS = 60 * 60 * 1000

@Injectable()
export class WordleService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WordleService.name)
  private staleCleanupTimer: ReturnType<typeof setInterval> | null = null

  constructor(
    private readonly repository: DrizzleWordleRepository,
    private readonly dictionary: WordleDictionary,
    private readonly leaderboardCache: WordleLeaderboardCache,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  onModuleInit(): void {
    this.runStaleCleanupSilently()
    this.staleCleanupTimer = setInterval(() => {
      this.runStaleCleanupSilently()
    }, STALE_CLEANUP_INTERVAL_MS)
  }

  onModuleDestroy(): void {
    if (this.staleCleanupTimer) clearInterval(this.staleCleanupTimer)
  }

  private runStaleCleanupSilently(): void {
    void this.runStaleCleanup().catch((error) => {
      this.logger.error('Не удалось закрыть устаревшие партии Wordle', error)
    })
  }

  @OnEvent(WsEvents.UPDATE_USERS)
  handleUserUpdated(): void {
    this.leaderboardCache.invalidate()
  }

  async runStaleCleanup(now: Date = new Date()): Promise<number> {
    const closed = await this.repository.closeStaleGames(getMoscowDateKey(now))
    if (closed > 0) this.leaderboardCache.invalidate()
    return closed
  }

  async getState(userId: string, now: Date = new Date()): Promise<WordleStateDTO> {
    const date = getMoscowDateKey(now)
    const game = await this.repository.findByUserAndDate(userId, date)
    return this.buildState(game, date, now)
  }

  async makeGuess(
    userId: string,
    rawWord: string,
    now: Date = new Date(),
  ): Promise<WordleStateDTO> {
    const date = getMoscowDateKey(now)

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

    if (updated.status !== WordleGameStatus.IN_PROGRESS) {
      this.leaderboardCache.invalidate()
      const payload: UpdateWordlePayload = { date, userId, action: 'finished' }
      this.eventEmitter.emit(WsEvents.UPDATE_WORDLE, payload)
    }

    return this.buildState(updated, date, now)
  }

  async getStats(userId: string, now: Date = new Date()): Promise<WordleStatsDTO> {
    const today = getMoscowDateKey(now)
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

    const [cached, winsToday, dailyRows] = await Promise.all([
      this.leaderboardCache.get(now.getTime(), async () => {
        const rows = await this.repository.findFinishedWithUsers()
        return buildLeaderboard(
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
      }),
      this.repository.countWinsByDate(today),
      this.repository.findFinishedWithUsersByDate(today),
    ])

    return {
      entries: cached.entries,
      totalPlayers: cached.totalPlayers,
      totalGames: cached.totalGames,
      winsToday,
      today: buildDailyLeaderboard(
        dailyRows.map(({ game, user }) => ({
          userId: user.id,
          login: user.login,
          profileImageUrl: user.profileImageUrl,
          color: user.color,
          status: game.status,
          attempts: game.guesses.length,
        })),
      ),
    }
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
