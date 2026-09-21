import { WordleGameStatus } from '@/enums'
import { daysBetween } from '@/modules/wordle/wordle.date'

export const MAX_ATTEMPTS = 6
export const WORD_LENGTH = 5

export interface WordleFinishedGame {
  date: string
  status: WordleGameStatus
  attempts: number
}

export interface WordleStats {
  played: number
  wins: number
  winRate: number
  currentStreak: number
  maxStreak: number
  distribution: number[]
}

export interface WordleLeaderboardRow {
  userId: string
  login: string
  profileImageUrl: string
  color: string
  date: string
  status: WordleGameStatus
  attempts: number
}

export interface WordleLeaderboardEntry {
  userId: string
  login: string
  profileImageUrl: string
  color: string
  wins: number
  currentStreak: number
  maxStreak: number
  avgAttempts: number
}

export interface WordleLeaderboardResult {
  entries: WordleLeaderboardEntry[]
  totalPlayers: number
  totalGames: number
}

export interface WordleDailyLeaderboardRow {
  userId: string
  login: string
  profileImageUrl: string
  color: string
  status: WordleGameStatus
  attempts: number
}

export interface WordleDailyLeaderboardResult {
  entries: WordleDailyLeaderboardRow[]
  total: number
}

function computeMaxStreak(games: WordleFinishedGame[]): number {
  let max = 0
  let run = 0
  let previousWin: WordleFinishedGame | null = null

  for (const game of games) {
    if (game.status !== WordleGameStatus.WON) {
      run = 0
      previousWin = null
      continue
    }

    run = previousWin && daysBetween(previousWin.date, game.date) === 1 ? run + 1 : 1
    previousWin = game
    max = Math.max(max, run)
  }

  return max
}

function computeCurrentStreak(games: WordleFinishedGame[], today: string): number {
  const last = games[games.length - 1]
  if (!last || last.status !== WordleGameStatus.WON) return 0
  if (daysBetween(last.date, today) > 1) return 0

  let run = 0
  let next: WordleFinishedGame | null = null

  for (let i = games.length - 1; i >= 0; i--) {
    const game = games[i]
    if (game.status !== WordleGameStatus.WON) break
    if (next && daysBetween(game.date, next.date) !== 1) break
    run += 1
    next = game
  }

  return run
}

export function computeWordleStats(games: WordleFinishedGame[], today: string): WordleStats {
  const sorted = [...games].sort((a, b) => a.date.localeCompare(b.date))
  const distribution = new Array<number>(MAX_ATTEMPTS).fill(0)
  let wins = 0

  for (const game of sorted) {
    if (game.status !== WordleGameStatus.WON) continue
    wins += 1
    const index = game.attempts - 1
    if (index >= 0 && index < MAX_ATTEMPTS) distribution[index] += 1
  }

  return {
    played: sorted.length,
    wins,
    winRate: sorted.length === 0 ? 0 : Math.round((wins / sorted.length) * 100),
    currentStreak: computeCurrentStreak(sorted, today),
    maxStreak: computeMaxStreak(sorted),
    distribution,
  }
}

export function buildLeaderboard(
  rows: WordleLeaderboardRow[],
  today: string,
  limit = 50,
): WordleLeaderboardResult {
  const byUser = new Map<string, { profile: WordleLeaderboardRow; games: WordleFinishedGame[] }>()

  for (const row of rows) {
    const game: WordleFinishedGame = { date: row.date, status: row.status, attempts: row.attempts }
    const entry = byUser.get(row.userId)
    if (entry) {
      entry.games.push(game)
    } else {
      byUser.set(row.userId, { profile: row, games: [game] })
    }
  }

  const entries: WordleLeaderboardEntry[] = []

  for (const [userId, { profile, games }] of byUser) {
    const stats = computeWordleStats(games, today)
    const wonGames = games.filter((game) => game.status === WordleGameStatus.WON)
    const totalAttempts = wonGames.reduce((sum, game) => sum + game.attempts, 0)
    const avgAttempts =
      wonGames.length === 0 ? 0 : Math.round((totalAttempts / wonGames.length) * 10) / 10

    entries.push({
      userId,
      login: profile.login,
      profileImageUrl: profile.profileImageUrl,
      color: profile.color,
      wins: stats.wins,
      currentStreak: stats.currentStreak,
      maxStreak: stats.maxStreak,
      avgAttempts,
    })
  }

  entries.sort(
    (a, b) =>
      b.wins - a.wins ||
      b.maxStreak - a.maxStreak ||
      a.avgAttempts - b.avgAttempts ||
      a.login.localeCompare(b.login),
  )

  return {
    entries: entries.slice(0, limit),
    totalPlayers: entries.length,
    totalGames: rows.length,
  }
}

function dailyStatusRank(status: WordleGameStatus): number {
  return status === WordleGameStatus.WON ? 0 : 1
}

export function buildDailyLeaderboard(
  rows: WordleDailyLeaderboardRow[],
): WordleDailyLeaderboardResult {
  const entries = [...rows].sort(
    (a, b) =>
      dailyStatusRank(a.status) - dailyStatusRank(b.status) ||
      a.attempts - b.attempts ||
      a.login.localeCompare(b.login),
  )

  return { entries, total: entries.length }
}
