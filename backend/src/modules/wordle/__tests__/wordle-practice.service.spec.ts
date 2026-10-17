import { describe, expect, it, mock } from 'bun:test'
import { BadRequestException } from '@nestjs/common'
import { WordleGameStatus } from '@/enums'
import {
  PRACTICE_KEY_PREFIX,
  PRACTICE_SPOILER_WINDOW_DAYS,
  PRACTICE_TTL_SECONDS,
  WordlePracticeService,
  derivePracticeStatus,
} from '@/modules/wordle/wordle-practice.service'
import { getMoscowDateKey, shiftDateKey } from '@/modules/wordle/wordle.date'
import { WordleLetterState } from '@/modules/wordle/wordle.scoring'
import type { WordleDictionary } from '@/modules/wordle/wordle.dictionary'
import type { RedisClient } from 'bun'

const NOW = new Date('2026-09-20T10:00:00.000Z')
const TODAY = getMoscowDateKey(NOW)
const ANSWER = 'слово'
const KEY = `${PRACTICE_KEY_PREFIX}:user-1`
const WRONG_GUESSES = ['кокос', 'ежики', 'птица', 'кокос', 'ежики']

function createRedisMock() {
  const store = new Map<string, string>()
  const send = mock(async (command: string, args: string[]) => {
    const [key = '', value] = args
    if (command === 'GET') return store.get(key) ?? null
    if (command === 'SET') {
      store.set(key, value ?? '')
      return 'OK'
    }
    return null
  })
  return { store, send }
}

function makeService(session?: { answer: string; guesses: string[] }) {
  const redis = createRedisMock()
  if (session) redis.store.set(KEY, JSON.stringify(session))

  const dictionary = {
    isValidWord: mock((word: string) => [ANSWER, ...WRONG_GUESSES].includes(word)),
    getAnswerForDate: mock((date: string) => `ответ-${date}`),
    getRandomAnswer: mock((exclude: readonly string[]) => {
      void exclude
      return ANSWER
    }),
  }

  const service = new WordlePracticeService(
    redis as unknown as RedisClient,
    dictionary as unknown as WordleDictionary,
  )
  return { service, redis, dictionary }
}

describe('derivePracticeStatus', () => {
  it('is in progress while attempts are left', () => {
    expect(derivePracticeStatus(ANSWER, [])).toBe(WordleGameStatus.IN_PROGRESS)
  })

  it('wins when the answer is guessed', () => {
    expect(derivePracticeStatus(ANSWER, ['кокос', ANSWER])).toBe(WordleGameStatus.WON)
  })

  it('loses after six wrong attempts', () => {
    expect(derivePracticeStatus(ANSWER, [...WRONG_GUESSES, 'птица'])).toBe(WordleGameStatus.LOST)
  })
})

describe('WordlePracticeService', () => {
  it('returns null without a session', async () => {
    const { service } = makeService()

    expect(await service.getState('user-1')).toBeNull()
  })

  it('starts a round excluding the daily spoiler window', async () => {
    const { service, redis, dictionary } = makeService()

    const state = await service.start('user-1', NOW)

    expect(state.status).toBe(WordleGameStatus.IN_PROGRESS)
    expect(state.answer).toBeNull()
    expect(state.guesses).toEqual([])
    expect(state.attempts).toBe(0)

    const excluded = dictionary.getRandomAnswer.mock.calls[0]?.[0] as string[]
    expect(excluded).toEqual(
      Array.from(
        { length: PRACTICE_SPOILER_WINDOW_DAYS },
        (_, offset) => `ответ-${shiftDateKey(TODAY, offset)}`,
      ),
    )

    const lastCall = redis.send.mock.calls.at(-1) as [string, string[]]
    expect(lastCall[1]).toEqual([
      KEY,
      JSON.stringify({ answer: ANSWER, guesses: [] }),
      'EX',
      String(PRACTICE_TTL_SECONDS),
    ])
  })

  it('excludes the previous practice answer when restarting', async () => {
    const { service, dictionary } = makeService({ answer: 'кокос', guesses: ['ежики'] })

    await service.start('user-1', NOW)

    const excluded = dictionary.getRandomAnswer.mock.calls[0]?.[0] as string[]
    expect(excluded).toContain('кокос')
  })

  it('rejects words outside the pattern', async () => {
    const { service } = makeService()

    await expect(service.makeGuess('user-1', 'abc')).rejects.toBeInstanceOf(BadRequestException)
  })

  it('rejects words missing from the dictionary', async () => {
    const { service } = makeService()

    await expect(service.makeGuess('user-1', 'абвгд')).rejects.toBeInstanceOf(BadRequestException)
  })

  it('rejects guesses without a session', async () => {
    const { service } = makeService()

    await expect(service.makeGuess('user-1', ANSWER)).rejects.toBeInstanceOf(BadRequestException)
  })

  it('scores a winning guess and reveals the answer', async () => {
    const { service, redis } = makeService({ answer: ANSWER, guesses: [] })

    const state = await service.makeGuess('user-1', 'СЛОВО')

    expect(state.status).toBe(WordleGameStatus.WON)
    expect(state.answer).toBe(ANSWER)
    expect(state.guesses).toEqual([
      { word: ANSWER, states: new Array(5).fill(WordleLetterState.CORRECT) },
    ])
    expect(JSON.parse(redis.store.get(KEY) ?? '{}')).toEqual({
      answer: ANSWER,
      guesses: [ANSWER],
    })
  })

  it('loses on the sixth wrong attempt and hides the answer before that', async () => {
    const { service } = makeService({ answer: ANSWER, guesses: [...WRONG_GUESSES] })

    const inProgress = await service.getState('user-1')
    expect(inProgress?.answer).toBeNull()

    const state = await service.makeGuess('user-1', 'птица')
    expect(state.status).toBe(WordleGameStatus.LOST)
    expect(state.answer).toBe(ANSWER)
  })

  it('rejects guesses after the round is finished', async () => {
    const { service } = makeService({ answer: ANSWER, guesses: [ANSWER] })

    await expect(service.makeGuess('user-1', 'кокос')).rejects.toBeInstanceOf(BadRequestException)
  })

  it('treats broken session payloads as absent', async () => {
    const { service, redis } = makeService()
    redis.store.set(KEY, '{не json')

    expect(await service.getState('user-1')).toBeNull()
  })

  it('propagates redis failures', async () => {
    const failing = {
      send: mock(async () => {
        throw new Error('ECONNREFUSED')
      }),
    }
    const service = new WordlePracticeService(
      failing as unknown as RedisClient,
      {
        isValidWord: mock(() => true),
        getAnswerForDate: mock(() => 'ответ'),
        getRandomAnswer: mock(() => ANSWER),
      } as unknown as WordleDictionary,
    )

    await expect(service.getState('user-1')).rejects.toThrow('ECONNREFUSED')
  })
})
