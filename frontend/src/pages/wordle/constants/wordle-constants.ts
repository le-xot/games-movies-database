import { WordleLetterState } from '@/lib/api'
import type { WordleLeaderboardDTO } from '@/lib/api'

export type WordleLeaderboardMode = 'today' | 'wins' | 'streak'

export const WORDLE_MAX_ATTEMPTS = 6
export const WORDLE_WORD_LENGTH = 5

export const WORDLE_KEYBOARD_ROWS = [
  ['й', 'ц', 'у', 'к', 'е', 'н', 'г', 'ш', 'щ', 'з', 'х', 'ъ'],
  ['ф', 'ы', 'в', 'а', 'п', 'р', 'о', 'л', 'д', 'ж', 'э'],
  ['enter', 'я', 'ч', 'с', 'м', 'и', 'т', 'ь', 'б', 'ю', 'backspace'],
] as const

export const KEYBOARD_CODE_MAP: Record<string, string> = {
  KeyQ: 'й',
  KeyW: 'ц',
  KeyE: 'у',
  KeyR: 'к',
  KeyT: 'е',
  KeyY: 'н',
  KeyU: 'г',
  KeyI: 'ш',
  KeyO: 'щ',
  KeyP: 'з',
  BracketLeft: 'х',
  BracketRight: 'ъ',
  KeyA: 'ф',
  KeyS: 'ы',
  KeyD: 'в',
  KeyF: 'а',
  KeyG: 'п',
  KeyH: 'р',
  KeyJ: 'о',
  KeyK: 'л',
  KeyL: 'д',
  Semicolon: 'ж',
  Quote: 'э',
  KeyZ: 'я',
  KeyX: 'ч',
  KeyC: 'с',
  KeyV: 'м',
  KeyB: 'и',
  KeyN: 'т',
  KeyM: 'ь',
  Comma: 'б',
  Period: 'ю',
}

export const LETTER_STATE_CLASS: Record<WordleLetterState, string> = {
  [WordleLetterState.CORRECT]: 'border-[#538d4e] bg-[#538d4e] text-white',
  [WordleLetterState.PRESENT]: 'border-[#b59f3b] bg-[#b59f3b] text-white',
  [WordleLetterState.ABSENT]: 'border-zinc-700 bg-zinc-700 text-white',
}

export const KEY_STATE_CLASS: Record<WordleLetterState, string> = {
  [WordleLetterState.CORRECT]: 'bg-[#538d4e] text-white',
  [WordleLetterState.PRESENT]: 'bg-[#b59f3b] text-white',
  [WordleLetterState.ABSENT]: 'bg-zinc-700 text-white',
}

export const COLORBLIND_LETTER_STATE_CLASS: Record<WordleLetterState, string> = {
  [WordleLetterState.CORRECT]: 'border-blue-600 bg-blue-600 text-white',
  [WordleLetterState.PRESENT]: 'border-orange-600 bg-orange-600 text-white',
  [WordleLetterState.ABSENT]: 'border-zinc-700 bg-zinc-700 text-white',
}

export const COLORBLIND_KEY_STATE_CLASS: Record<WordleLetterState, string> = {
  [WordleLetterState.CORRECT]: 'bg-blue-600 text-white',
  [WordleLetterState.PRESENT]: 'bg-orange-600 text-white',
  [WordleLetterState.ABSENT]: 'bg-zinc-700 text-white',
}

export const LETTER_STATE_RANK: Record<WordleLetterState, number> = {
  [WordleLetterState.ABSENT]: 0,
  [WordleLetterState.PRESENT]: 1,
  [WordleLetterState.CORRECT]: 2,
}

export function normalizeWordleWord(word: string): string {
  return word.trim().toLowerCase().replace(/ё/g, 'е')
}

export type WordleGuessCell = string | null

export function emptyGuessCells(length: number): WordleGuessCell[] {
  return Array.from({ length }, () => null)
}

/** Ставит букву (или null для очистки) ровно в клетку; индекс вне ряда игнорируется. */
export function placeLetterInCells(
  cells: WordleGuessCell[],
  index: number,
  letter: WordleGuessCell,
): WordleGuessCell[] {
  if (index < 0 || index >= cells.length) return cells
  const next = cells.slice()
  next[index] = letter
  return next
}

/** Переносит букву: пустая целевая клетка — перемещение с дыркой, занятая — обмен местами. */
export function moveLetterInCells(
  cells: WordleGuessCell[],
  from: number,
  to: number,
): WordleGuessCell[] {
  if (from < 0 || from >= cells.length || to < 0 || to >= cells.length) return cells
  const letter = cells[from]
  if (letter === null || from === to) return cells
  const next = cells.slice()
  next[from] = next[to]
  next[to] = letter
  return next
}

export function firstEmptyIndex(cells: WordleGuessCell[]): number {
  return cells.findIndex((cell) => cell === null)
}

export function lastFilledIndex(cells: WordleGuessCell[]): number {
  for (let index = cells.length - 1; index >= 0; index--) {
    if (cells[index] !== null) return index
  }
  return -1
}

export function formatWordleGlobalStats(leaderboard?: WordleLeaderboardDTO): string {
  return `Игроков ${leaderboard?.totalPlayers ?? 0} · Игр ${leaderboard?.totalGames ?? 0} · Побед сегодня ${leaderboard?.winsToday ?? 0}`
}
