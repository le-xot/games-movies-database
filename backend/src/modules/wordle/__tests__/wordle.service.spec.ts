import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { BadRequestException } from '@nestjs/common'
import { createMock } from '@/__tests__/helpers/mock-factory'
import { WordleGameStatus } from '@/enums'
import {
  DrizzleWordleRepository,
  type WordleGameRecord,
} from '@/modules/wordle/repositories/drizzle-wordle.repository'
import { getMoscowDateKey } from '@/modules/wordle/wordle.date'
import { WordleService } from '@/modules/wordle/wordle.service'
import type { WordleDictionary } from '@/modules/wordle/wordle.dictionary'

const NOW = new Date('2026-09-20T10:00:00.000Z')
const TODAY = getMoscowDateKey(NOW)
const ANSWER = 'слово'

const makeGame = (overrides?: Partial<WordleGameRecord>): WordleGameRecord => ({
  id: 'game-1',
  userId: 'user-1',
  date: TODAY,
  answer: ANSWER,
  guesses: [],
  status: WordleGameStatus.IN_PROGRESS,
  createdAt: new Date('2026-09-20T09:00:00Z'),
  ...overrides,
})

describe('WordleService', () => {
  let service: WordleService
  let mockRepo: DrizzleWordleRepository
  let mockDictionary: {
    isValidWord: ReturnType<typeof mock>
    getAnswerForDate: ReturnType<typeof mock>
  }

  beforeEach(() => {
    mockRepo = createMock(DrizzleWordleRepository)
    mockDictionary = {
      isValidWord: mock((word: string) => ['слово', 'кокос', 'ежики', 'птица'].includes(word)),
      getAnswerForDate: mock(() => ANSWER),
    }
    service = new WordleService(mockRepo, mockDictionary as unknown as WordleDictionary)
  })

  describe('getState', () => {
    it('returns an empty in-progress state without a game', async () => {
      mockRepo.findByUserAndDate = mock(() => Promise.resolve(null))

      const state = await service.getState('user-1', NOW)

      expect(mockRepo.closeStaleGames).toHaveBeenCalledWith(TODAY)
      expect(state).toMatchObject({
        date: TODAY,
        status: WordleGameStatus.IN_PROGRESS,
        attempts: 0,
        maxAttempts: 6,
        wordLength: 5,
        guesses: [],
        answer: null,
      })
      expect(state.msUntilNextWord).toBe(39_600_000)
    })

    it('hides the answer while the game is in progress', async () => {
      mockRepo.findByUserAndDate = mock(() => Promise.resolve(makeGame({ guesses: ['кокос'] })))

      const state = await service.getState('user-1', NOW)

      expect(state.answer).toBeNull()
      expect(state.attempts).toBe(1)
      expect(state.guesses[0]?.word).toBe('кокос')
    })

    it('reveals the answer after the game is finished', async () => {
      mockRepo.findByUserAndDate = mock(() =>
        Promise.resolve(makeGame({ guesses: [ANSWER], status: WordleGameStatus.WON })),
      )

      const state = await service.getState('user-1', NOW)

      expect(state.answer).toBe(ANSWER)
      expect(state.status).toBe(WordleGameStatus.WON)
    })
  })

  describe('makeGuess', () => {
    beforeEach(() => {
      mockRepo.findByUserAndDate = mock(() => Promise.resolve(makeGame()))
      mockRepo.appendGuess = mock((_id: string, word: string) =>
        Promise.resolve(makeGame({ guesses: [word], status: WordleGameStatus.IN_PROGRESS })),
      )
    })

    it('rejects words that are not five cyrillic letters', async () => {
      await expect(service.makeGuess('user-1', 'кот', NOW)).rejects.toThrow(BadRequestException)
      await expect(service.makeGuess('user-1', 'hello', NOW)).rejects.toThrow(BadRequestException)
      await expect(service.makeGuess('user-1', 'сл4во', NOW)).rejects.toThrow(BadRequestException)
      expect(mockRepo.appendGuess).not.toHaveBeenCalled()
    })

    it('rejects words missing from the dictionary', async () => {
      await expect(service.makeGuess('user-1', 'книга', NOW)).rejects.toThrow(
        new BadRequestException('Слово не найдено в словаре'),
      )
    })

    it('normalizes yo to ye before validation', async () => {
      await service.makeGuess('user-1', 'ЁЖИКИ', NOW)

      expect(mockRepo.appendGuess).toHaveBeenCalledWith('game-1', 'ежики')
    })

    it('allows repeating a guess and spends an attempt', async () => {
      mockRepo.findByUserAndDate = mock(() => Promise.resolve(makeGame({ guesses: ['кокос'] })))
      mockRepo.appendGuess = mock((_id: string, word: string) =>
        Promise.resolve(
          makeGame({ guesses: ['кокос', word], status: WordleGameStatus.IN_PROGRESS }),
        ),
      )

      const state = await service.makeGuess('user-1', 'кокос', NOW)

      expect(mockRepo.appendGuess).toHaveBeenCalledWith('game-1', 'кокос')
      expect(state.attempts).toBe(2)
      expect(state.status).toBe(WordleGameStatus.IN_PROGRESS)
    })

    it('wins when the answer is guessed', async () => {
      mockRepo.appendGuess = mock(() =>
        Promise.resolve(makeGame({ guesses: [ANSWER], status: WordleGameStatus.WON })),
      )

      const state = await service.makeGuess('user-1', ANSWER, NOW)

      expect(mockRepo.appendGuess).toHaveBeenCalledWith('game-1', ANSWER)
      expect(state.status).toBe(WordleGameStatus.WON)
      expect(state.answer).toBe(ANSWER)
    })

    it('loses on the sixth wrong guess', async () => {
      mockRepo.findByUserAndDate = mock(() =>
        Promise.resolve(makeGame({ guesses: ['кокос', 'кокос', 'кокос', 'кокос', 'кокос'] })),
      )
      mockRepo.appendGuess = mock((_id: string, word: string) =>
        Promise.resolve(
          makeGame({
            guesses: ['кокос', 'кокос', 'кокос', 'кокос', 'кокос', word],
            status: WordleGameStatus.LOST,
          }),
        ),
      )

      const state = await service.makeGuess('user-1', 'птица', NOW)

      expect(state.status).toBe(WordleGameStatus.LOST)
      expect(state.answer).toBe(ANSWER)
    })

    it('rejects guesses after the game is finished', async () => {
      mockRepo.findByUserAndDate = mock(() =>
        Promise.resolve(makeGame({ guesses: [ANSWER], status: WordleGameStatus.WON })),
      )

      await expect(service.makeGuess('user-1', 'кокос', NOW)).rejects.toThrow(
        new BadRequestException('Игра на сегодня уже завершена'),
      )
      expect(mockRepo.appendGuess).not.toHaveBeenCalled()
    })

    it('rejects the guess when a concurrent request already finished the game', async () => {
      mockRepo.appendGuess = mock(() => Promise.resolve(null))

      await expect(service.makeGuess('user-1', 'кокос', NOW)).rejects.toThrow(
        new BadRequestException('Игра на сегодня уже завершена'),
      )
    })

    it('creates a game lazily on the first guess', async () => {
      mockRepo.findByUserAndDate = mock(() => Promise.resolve(null))
      mockRepo.createGame = mock((data: Partial<WordleGameRecord>) =>
        Promise.resolve(makeGame(data)),
      )
      mockRepo.appendGuess = mock((_id: string, word: string) =>
        Promise.resolve(makeGame({ guesses: [word], status: WordleGameStatus.IN_PROGRESS })),
      )

      await service.makeGuess('user-1', 'кокос', NOW)

      expect(mockRepo.createGame).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user-1', date: TODAY, answer: ANSWER }),
      )
      expect(mockDictionary.getAnswerForDate).toHaveBeenCalledWith(TODAY)
    })
  })

  describe('getStats', () => {
    it('computes stats from finished games', async () => {
      mockRepo.findFinishedByUser = mock(() =>
        Promise.resolve([
          makeGame({ date: '2026-09-18', guesses: ['кокос'], status: WordleGameStatus.WON }),
          makeGame({ date: '2026-09-19', guesses: ['кокос'], status: WordleGameStatus.LOST }),
        ]),
      )

      const stats = await service.getStats('user-1', NOW)

      expect(stats.played).toBe(2)
      expect(stats.wins).toBe(1)
      expect(stats.winRate).toBe(50)
      expect(stats.distribution).toEqual([1, 0, 0, 0, 0, 0])
    })
  })

  describe('getLeaderboard', () => {
    it('maps repository rows to the leaderboard', async () => {
      mockRepo.findFinishedWithUsers = mock(() =>
        Promise.resolve([
          {
            game: makeGame({ guesses: [ANSWER], status: WordleGameStatus.WON }),
            user: {
              id: 'user-1',
              login: 'lexa',
              profileImageUrl: 'https://example.com/1.png',
              color: '#123456',
            },
          },
        ]),
      )
      mockRepo.countWinsByDate = mock(() => Promise.resolve(1))

      const leaderboard = await service.getLeaderboard(NOW)

      expect(leaderboard.winsToday).toBe(1)
      expect(leaderboard.totalGames).toBe(1)
      expect(leaderboard.entries[0]).toMatchObject({
        userId: 'user-1',
        login: 'lexa',
        wins: 1,
        avgAttempts: 1,
      })
    })
  })
})
