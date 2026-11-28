import { WordleGameStatus } from '@backend/enums'
import { WordleLetterState } from '@backend/modules/wordle/wordle.scoring'
import { WordleHistoryStatus } from '@backend/modules/wordle/wordle.stats'

/**
 * Доменные типы Wordle: их отдают сервисы и на них же типизированы порты
 * гейтвея (проводную форму по-прежнему держат TypeBox-схемы).
 */
export interface WordleGuessState {
  word: string
  states: WordleLetterState[]
}

export interface WordlePracticeState {
  status: WordleGameStatus
  attempts: number
  maxAttempts: number
  wordLength: number
  guesses: WordleGuessState[]
  answer: string | null
}

export interface WordleState {
  date: string
  status: WordleGameStatus
  attempts: number
  maxAttempts: number
  wordLength: number
  guesses: WordleGuessState[]
  answer: string | null
  msUntilNextWord: number
}

export interface WordleHistoryDay {
  date: string
  status: WordleHistoryStatus
}

export interface WordleStats {
  played: number
  wins: number
  winRate: number
  currentStreak: number
  maxStreak: number
  distribution: number[]
  rank: number | null
  totalPlayers: number
  history: WordleHistoryDay[]
}

export interface WordleLeaderboardEntry {
  userId: string
  login: string
  profileImageUrl: string
  color: string
  avatarFrameId: string | null
  wins: number
  currentStreak: number
  maxStreak: number
  avgAttempts: number
}

export interface WordleDailyGuess {
  states: WordleLetterState[]
}

export interface WordleDailyLeaderboardEntry {
  userId: string
  login: string
  profileImageUrl: string
  color: string
  avatarFrameId: string | null
  status: WordleGameStatus
  attempts: number
  guesses: WordleDailyGuess[]
}

export interface WordleDailyLeaderboard {
  entries: WordleDailyLeaderboardEntry[]
  total: number
}

export interface WordleLeaderboard {
  entries: WordleLeaderboardEntry[]
  totalPlayers: number
  totalGames: number
  winsToday: number
  today: WordleDailyLeaderboard
}
