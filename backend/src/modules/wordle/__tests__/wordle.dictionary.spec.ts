import { describe, expect, it } from 'bun:test'
import { readFileSync } from 'node:fs'
import { WordleDictionary, normalizeWord } from '@/modules/wordle/wordle.dictionary'

const readData = (name: string) =>
  readFileSync(new URL(`../data/${name}`, import.meta.url), 'utf-8')

const parseData = (name: string) =>
  readData(name)
    .split('\n')
    .filter((line) => line.length > 0)

const ANSWERS = parseData('answers.txt')
const WORDS = parseData('words.txt')
const BLACKLIST = parseData('blacklist.txt')

describe('normalizeWord', () => {
  it('lowercases and trims the word', () => {
    expect(normalizeWord(' СЛОВО ')).toBe('слово')
  })

  it('replaces yo with ye', () => {
    expect(normalizeWord('ЁЖИКИ')).toBe('ежики')
  })
})

describe('WordleDictionary', () => {
  const dictionary = new WordleDictionary()

  it('accepts a known word', () => {
    expect(dictionary.isValidWord('слово')).toBe(true)
  })

  it('rejects an unknown word', () => {
    expect(dictionary.isValidWord('словп')).toBe(false)
  })

  it('rejects blacklisted words', () => {
    for (const word of BLACKLIST) {
      expect(dictionary.isValidWord(word)).toBe(false)
    }
  })

  it('returns the same answer for the same date', () => {
    expect(dictionary.getAnswerForDate('2026-09-20')).toBe(
      dictionary.getAnswerForDate('2026-09-20'),
    )
  })

  it('rotates answers across consecutive days', () => {
    expect(dictionary.getAnswerForDate('2026-09-21')).not.toBe(
      dictionary.getAnswerForDate('2026-09-20'),
    )
  })

  it('keeps every answer guessable', () => {
    for (let i = 0; i < ANSWERS.length + 7; i++) {
      const date = new Date(Date.UTC(2026, 0, 1) + i * 86_400_000).toISOString().slice(0, 10)
      expect(dictionary.isValidWord(dictionary.getAnswerForDate(date))).toBe(true)
    }
  })
})

describe('data files', () => {
  it('uses the expected format for every word', () => {
    for (const word of [...ANSWERS, ...WORDS, ...BLACKLIST]) {
      expect(word).toMatch(/^[а-я]{5}$/)
    }
  })

  it('has no duplicates', () => {
    expect(new Set(ANSWERS).size).toBe(ANSWERS.length)
    expect(new Set(WORDS).size).toBe(WORDS.length)
    expect(new Set(BLACKLIST).size).toBe(BLACKLIST.length)
  })

  it('keeps every answer within the allowed guesses', () => {
    const words = new Set(WORDS)
    for (const answer of ANSWERS) {
      expect(words.has(answer)).toBe(true)
    }
  })

  it('does not intersect answers with the blacklist', () => {
    const blacklist = new Set(BLACKLIST)
    for (const answer of ANSWERS) {
      expect(blacklist.has(answer)).toBe(false)
    }
  })

  it('has enough answers and guesses for a long game cycle', () => {
    expect(ANSWERS.length).toBeGreaterThanOrEqual(1200)
    expect(WORDS.length).toBeGreaterThanOrEqual(20000)
  })

  it('has no trailing or double line breaks', () => {
    const raw = readData('answers.txt')
    expect(raw.endsWith('\n')).toBe(true)
    expect(raw).not.toMatch(/\n\n/)
    expect(raw).not.toMatch(/\r/)
  })
})
