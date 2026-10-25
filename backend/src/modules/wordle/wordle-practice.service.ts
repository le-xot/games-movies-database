import { WordleGameStatus } from '@backend/enums'
import { getMoscowDateKey, shiftDateKey } from '@backend/modules/wordle/wordle.date'
import {
  WordleDictionary,
  WORD_PATTERN,
  normalizeWord,
} from '@backend/modules/wordle/wordle.dictionary'
import { WordlePracticeStateDTO } from '@backend/modules/wordle/wordle.dto'
import { scoreGuess } from '@backend/modules/wordle/wordle.scoring'
import { MAX_ATTEMPTS, WORD_LENGTH } from '@backend/modules/wordle/wordle.stats'
import { BadRequestException } from '@backend/utils/errors'
import { Logger } from '@backend/utils/logger'
import { RedisClient } from 'bun'

export const PRACTICE_KEY_PREFIX = 'wordle:practice'
export const PRACTICE_TTL_SECONDS = 86_400
/** Практика не должна спойлерить слово дня: исключаем ответы сегодня и ближайших двух недель. */
export const PRACTICE_SPOILER_WINDOW_DAYS = 14

export interface WordlePracticeSession {
  answer: string
  guesses: string[]
}

export function derivePracticeStatus(answer: string, guesses: string[]): WordleGameStatus {
  if (guesses.includes(answer)) return WordleGameStatus.WON
  if (guesses.length >= MAX_ATTEMPTS) return WordleGameStatus.LOST
  return WordleGameStatus.IN_PROGRESS
}

export class WordlePracticeService {
  private readonly logger = new Logger(WordlePracticeService.name)

  constructor(
    private readonly redis: RedisClient,
    private readonly dictionary: WordleDictionary,
  ) {}

  async getState(userId: string): Promise<WordlePracticeStateDTO | null> {
    const session = await this.readSession(userId)
    return session ? this.buildState(session) : null
  }

  async start(userId: string, now: Date = new Date()): Promise<WordlePracticeStateDTO> {
    const previous = await this.readSession(userId)
    const excluded = this.getUpcomingAnswers(getMoscowDateKey(now))
    if (previous) excluded.push(previous.answer)

    const session: WordlePracticeSession = {
      answer: this.dictionary.getRandomAnswer(excluded),
      guesses: [],
    }
    await this.writeSession(userId, session)
    return this.buildState(session)
  }

  async makeGuess(userId: string, rawWord: string): Promise<WordlePracticeStateDTO> {
    const word = normalizeWord(rawWord)
    if (!WORD_PATTERN.test(word)) {
      throw new BadRequestException('Слово должно состоять из 5 русских букв')
    }
    if (!this.dictionary.isValidWord(word)) {
      throw new BadRequestException('Слово не найдено в словаре')
    }

    const session = await this.readSession(userId)
    if (!session) throw new BadRequestException('Тренировочная партия не начата')
    if (derivePracticeStatus(session.answer, session.guesses) !== WordleGameStatus.IN_PROGRESS) {
      throw new BadRequestException('Тренировочная партия уже завершена')
    }

    // Гонка двух вкладок осознанно принята: режим неучётный, цена — потеря одной догадки.
    session.guesses.push(word)
    await this.writeSession(userId, session)
    return this.buildState(session)
  }

  private getUpcomingAnswers(today: string): string[] {
    return Array.from({ length: PRACTICE_SPOILER_WINDOW_DAYS }, (_, offset) =>
      this.dictionary.getAnswerForDate(shiftDateKey(today, offset)),
    )
  }

  private buildState(session: WordlePracticeSession): WordlePracticeStateDTO {
    const status = derivePracticeStatus(session.answer, session.guesses)

    return {
      status,
      attempts: session.guesses.length,
      maxAttempts: MAX_ATTEMPTS,
      wordLength: WORD_LENGTH,
      guesses: session.guesses.map((word) => ({
        word,
        states: scoreGuess(session.answer, word),
      })),
      answer: status === WordleGameStatus.IN_PROGRESS ? null : session.answer,
    }
  }

  private key(userId: string): string {
    return `${PRACTICE_KEY_PREFIX}:${userId}`
  }

  private async readSession(userId: string): Promise<WordlePracticeSession | null> {
    const raw = await this.redis.send('GET', [this.key(userId)])
    if (typeof raw !== 'string') return null

    try {
      const parsed = JSON.parse(raw) as Partial<WordlePracticeSession>
      if (typeof parsed.answer !== 'string' || !Array.isArray(parsed.guesses)) {
        this.logger.warn(`Повреждённая тренировочная сессия Wordle: ${this.key(userId)}`)
        return null
      }
      const guesses = parsed.guesses.filter((word): word is string => typeof word === 'string')
      return { answer: parsed.answer, guesses }
    } catch {
      this.logger.warn(`Повреждённая тренировочная сессия Wordle: ${this.key(userId)}`)
      return null
    }
  }

  private async writeSession(userId: string, session: WordlePracticeSession): Promise<void> {
    await this.redis.send('SET', [
      this.key(userId),
      JSON.stringify(session),
      'EX',
      String(PRACTICE_TTL_SECONDS),
    ])
  }
}
