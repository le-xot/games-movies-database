import { WordleGameStatus } from '@/enums'
import { WordleLetterState } from '@/modules/wordle/wordle.scoring'
import { WordleHistoryStatus } from '@/modules/wordle/wordle.stats'

export class WordleGuessDTO {
  word!: string
}

export class WordleGuessStateDTO {
  word!: string

  states!: WordleLetterState[]
}

export class WordlePracticeStateDTO {
  status!: WordleGameStatus

  attempts!: number

  maxAttempts!: number

  wordLength!: number

  guesses!: WordleGuessStateDTO[]

  answer!: string | null
}

export class WordleStateDTO {
  date!: string

  status!: WordleGameStatus

  attempts!: number

  maxAttempts!: number

  wordLength!: number

  guesses!: WordleGuessStateDTO[]

  answer!: string | null

  msUntilNextWord!: number
}

export class WordleHistoryDayDTO {
  date!: string

  status!: WordleHistoryStatus
}

export class WordleStatsDTO {
  played!: number

  wins!: number

  winRate!: number

  currentStreak!: number

  maxStreak!: number

  distribution!: number[]

  rank!: number | null

  totalPlayers!: number

  history!: WordleHistoryDayDTO[]
}

export class WordleLeaderboardEntryDTO {
  userId!: string

  login!: string

  profileImageUrl!: string

  color!: string

  wins!: number

  currentStreak!: number

  maxStreak!: number

  avgAttempts!: number
}

export class WordleDailyGuessDTO {
  states!: WordleLetterState[]
}

export class WordleDailyLeaderboardEntryDTO {
  userId!: string

  login!: string

  profileImageUrl!: string

  color!: string

  status!: WordleGameStatus

  attempts!: number

  guesses!: WordleDailyGuessDTO[]
}

export class WordleDailyLeaderboardDTO {
  entries!: WordleDailyLeaderboardEntryDTO[]

  total!: number
}

export class WordleLeaderboardDTO {
  entries!: WordleLeaderboardEntryDTO[]

  totalPlayers!: number

  totalGames!: number

  winsToday!: number

  today!: WordleDailyLeaderboardDTO
}
