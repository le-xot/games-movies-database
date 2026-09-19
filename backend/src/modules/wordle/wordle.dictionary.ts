import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { Injectable } from '@nestjs/common'

const DAY_MS = 24 * 60 * 60 * 1000
const WORD_PATTERN = /^[а-я]{5}$/

export function normalizeWord(word: string): string {
  return word.trim().toLowerCase().replace(/ё/g, 'е')
}

function parseWordList(fileUrl: URL): string[] {
  return readFileSync(fileURLToPath(fileUrl), 'utf-8')
    .split('\n')
    .map((line) => normalizeWord(line))
    .filter((word) => WORD_PATTERN.test(word))
}

@Injectable()
export class WordleDictionary {
  private readonly words = new Set(parseWordList(new URL('./data/words.txt', import.meta.url)))
  private readonly answers = parseWordList(new URL('./data/answers.txt', import.meta.url))

  isValidWord(word: string): boolean {
    return this.words.has(word)
  }

  getAnswerForDate(dateKey: string): string {
    return this.answers[this.answerIndex(dateKey)]
  }

  private answerIndex(dateKey: string): number {
    const days = Math.floor(Date.parse(`${dateKey}T00:00:00Z`) / DAY_MS)
    return ((days % this.answers.length) + this.answers.length) % this.answers.length
  }
}
