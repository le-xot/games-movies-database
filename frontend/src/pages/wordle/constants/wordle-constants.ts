import { WordleLetterState } from '@/lib/api'

export const WORDLE_MAX_ATTEMPTS = 6
export const WORDLE_WORD_LENGTH = 5

export const WORDLE_KEYBOARD_ROWS: string[][] = [
  ['й', 'ц', 'у', 'к', 'е', 'н', 'г', 'ш', 'щ', 'з', 'х', 'ъ'],
  ['ф', 'ы', 'в', 'а', 'п', 'р', 'о', 'л', 'д', 'ж', 'э'],
  ['enter', 'я', 'ч', 'с', 'м', 'и', 'т', 'ь', 'б', 'ю', 'backspace'],
]

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
  [WordleLetterState.CORRECT]: 'border-green-600 bg-green-600 text-white',
  [WordleLetterState.PRESENT]: 'border-yellow-500 bg-yellow-500 text-white',
  [WordleLetterState.ABSENT]: 'border-zinc-700 bg-zinc-700 text-white',
}

export const KEY_STATE_CLASS: Record<WordleLetterState, string> = {
  [WordleLetterState.CORRECT]: 'bg-green-600 text-white',
  [WordleLetterState.PRESENT]: 'bg-yellow-500 text-white',
  [WordleLetterState.ABSENT]: 'bg-zinc-800 text-zinc-500',
}

export const LETTER_STATE_RANK: Record<WordleLetterState, number> = {
  [WordleLetterState.ABSENT]: 0,
  [WordleLetterState.PRESENT]: 1,
  [WordleLetterState.CORRECT]: 2,
}

export function normalizeWordleWord(word: string): string {
  return word.trim().toLowerCase().replace(/ё/g, 'е')
}
