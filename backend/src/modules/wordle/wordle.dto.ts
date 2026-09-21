import { ApiProperty } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { Matches } from 'class-validator'
import { WordleGameStatus } from '@/enums'
import { WordleGameStatus as WordleGameStatusName } from '@/enums/enums.names'
import { WordleLetterState } from '@/modules/wordle/wordle.scoring'

export class WordleGuessDTO {
  @ApiProperty({ example: 'слово' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @Matches(/^[а-яёА-ЯЁ]{5}$/, { message: 'Слово должно состоять из 5 русских букв' })
  word: string
}

export class WordleGuessStateDTO {
  @ApiProperty({ example: 'слово' })
  word: string

  @ApiProperty({ enum: WordleLetterState, enumName: 'WordleLetterState', isArray: true })
  states: WordleLetterState[]
}

export class WordleStateDTO {
  @ApiProperty({ example: '2026-09-20' })
  date: string

  @ApiProperty({ enum: WordleGameStatus, enumName: WordleGameStatusName })
  status: WordleGameStatus

  @ApiProperty({ example: 3 })
  attempts: number

  @ApiProperty({ example: 6 })
  maxAttempts: number

  @ApiProperty({ example: 5 })
  wordLength: number

  @ApiProperty({ type: [WordleGuessStateDTO] })
  guesses: WordleGuessStateDTO[]

  @ApiProperty({ type: String, nullable: true, example: null })
  answer: string | null

  @ApiProperty({ example: 43_200_000 })
  msUntilNextWord: number
}

export class WordleStatsDTO {
  @ApiProperty()
  played: number

  @ApiProperty()
  wins: number

  @ApiProperty()
  winRate: number

  @ApiProperty()
  currentStreak: number

  @ApiProperty()
  maxStreak: number

  @ApiProperty({ type: [Number] })
  distribution: number[]
}

export class WordleLeaderboardEntryDTO {
  @ApiProperty()
  userId: string

  @ApiProperty()
  login: string

  @ApiProperty()
  profileImageUrl: string

  @ApiProperty()
  color: string

  @ApiProperty()
  wins: number

  @ApiProperty()
  currentStreak: number

  @ApiProperty()
  maxStreak: number

  @ApiProperty()
  avgAttempts: number
}

export class WordleDailyLeaderboardEntryDTO {
  @ApiProperty()
  userId: string

  @ApiProperty()
  login: string

  @ApiProperty()
  profileImageUrl: string

  @ApiProperty()
  color: string

  @ApiProperty({ enum: WordleGameStatus, enumName: WordleGameStatusName })
  status: WordleGameStatus

  @ApiProperty({ example: 3 })
  attempts: number
}

export class WordleDailyLeaderboardDTO {
  @ApiProperty({ type: [WordleDailyLeaderboardEntryDTO] })
  entries: WordleDailyLeaderboardEntryDTO[]

  @ApiProperty()
  total: number
}

export class WordleLeaderboardDTO {
  @ApiProperty({ type: [WordleLeaderboardEntryDTO] })
  entries: WordleLeaderboardEntryDTO[]

  @ApiProperty()
  totalPlayers: number

  @ApiProperty()
  totalGames: number

  @ApiProperty()
  winsToday: number

  @ApiProperty({ type: WordleDailyLeaderboardDTO })
  today: WordleDailyLeaderboardDTO
}
