import { describe, expect, it } from 'bun:test'
import { WordleGameStatus } from '@/enums'
import {
  buildDailyLeaderboard,
  buildLeaderboard,
  computeWordleStats,
} from '@/modules/wordle/wordle.stats'
import type {
  WordleDailyLeaderboardRow,
  WordleFinishedGame,
  WordleLeaderboardRow,
} from '@/modules/wordle/wordle.stats'

const { WON, LOST } = WordleGameStatus
const TODAY = '2026-09-20'

const game = (date: string, status: WordleGameStatus, attempts: number): WordleFinishedGame => ({
  date,
  status,
  attempts,
})

describe('computeWordleStats', () => {
  it('returns zeroed stats without games', () => {
    expect(computeWordleStats([], TODAY)).toEqual({
      played: 0,
      wins: 0,
      winRate: 0,
      currentStreak: 0,
      maxStreak: 0,
      distribution: [0, 0, 0, 0, 0, 0],
    })
  })

  it('counts played games, wins and win rate', () => {
    const stats = computeWordleStats(
      [game('2026-09-18', WON, 3), game('2026-09-19', LOST, 6), game('2026-09-20', WON, 4)],
      TODAY,
    )

    expect(stats.played).toBe(3)
    expect(stats.wins).toBe(2)
    expect(stats.winRate).toBe(67)
  })

  it('builds the distribution by attempts of won games only', () => {
    const stats = computeWordleStats(
      [game('2026-09-18', WON, 3), game('2026-09-19', WON, 3), game('2026-09-20', WON, 4)],
      TODAY,
    )

    expect(stats.distribution).toEqual([0, 0, 2, 1, 0, 0])
  })

  it('counts a streak ending today', () => {
    const stats = computeWordleStats(
      [game('2026-09-18', WON, 3), game('2026-09-19', WON, 4), game('2026-09-20', WON, 5)],
      TODAY,
    )

    expect(stats.currentStreak).toBe(3)
    expect(stats.maxStreak).toBe(3)
  })

  it('keeps the streak alive when the last win was yesterday', () => {
    const stats = computeWordleStats(
      [game('2026-09-18', WON, 3), game('2026-09-19', WON, 4)],
      TODAY,
    )

    expect(stats.currentStreak).toBe(2)
  })

  it('resets the current streak after a missed day', () => {
    const stats = computeWordleStats(
      [game('2026-09-17', WON, 3), game('2026-09-18', WON, 4)],
      TODAY,
    )

    expect(stats.currentStreak).toBe(0)
    expect(stats.maxStreak).toBe(2)
  })

  it('resets the current streak after a loss', () => {
    const stats = computeWordleStats(
      [game('2026-09-18', WON, 3), game('2026-09-19', WON, 4), game('2026-09-20', LOST, 6)],
      TODAY,
    )

    expect(stats.currentStreak).toBe(0)
    expect(stats.maxStreak).toBe(2)
  })

  it('keeps the longest streak across gaps', () => {
    const stats = computeWordleStats(
      [
        game('2026-09-10', WON, 3),
        game('2026-09-11', WON, 3),
        game('2026-09-12', WON, 3),
        game('2026-09-15', WON, 3),
        game('2026-09-16', WON, 3),
      ],
      TODAY,
    )

    expect(stats.maxStreak).toBe(3)
    expect(stats.currentStreak).toBe(0)
  })
})

describe('buildLeaderboard', () => {
  const row = (
    userId: string,
    date: string,
    status: WordleGameStatus,
    attempts: number,
  ): WordleLeaderboardRow => ({
    userId,
    login: `user-${userId}`,
    profileImageUrl: `https://example.com/${userId}.png`,
    color: '#333333',
    date,
    status,
    attempts,
  })

  it('returns empty result without rows', () => {
    expect(buildLeaderboard([], TODAY)).toEqual({ entries: [], totalPlayers: 0, totalGames: 0 })
  })

  it('sorts by wins and counts totals', () => {
    const result = buildLeaderboard(
      [
        row('a', '2026-09-19', WON, 3),
        row('b', '2026-09-18', WON, 3),
        row('b', '2026-09-19', WON, 4),
        row('b', '2026-09-20', WON, 5),
        row('a', '2026-09-20', WON, 6),
      ],
      TODAY,
    )

    expect(result.entries.map((entry) => entry.userId)).toEqual(['b', 'a'])
    expect(result.entries[0]).toMatchObject({
      wins: 3,
      currentStreak: 3,
      maxStreak: 3,
      avgAttempts: 4,
    })
    expect(result.entries[1]).toMatchObject({ wins: 2, currentStreak: 2, avgAttempts: 4.5 })
    expect(result.totalPlayers).toBe(2)
    expect(result.totalGames).toBe(5)
  })

  it('breaks ties by max streak', () => {
    const result = buildLeaderboard(
      [
        row('a', '2026-09-19', WON, 2),
        row('a', '2026-09-20', WON, 3),
        row('b', '2026-09-18', WON, 5),
        row('b', '2026-09-19', LOST, 6),
        row('b', '2026-09-20', WON, 1),
      ],
      TODAY,
    )

    expect(result.entries.map((entry) => entry.userId)).toEqual(['a', 'b'])
  })

  it('breaks ties by average attempts', () => {
    const result = buildLeaderboard(
      [row('a', '2026-09-20', WON, 5), row('b', '2026-09-20', WON, 2)],
      TODAY,
    )

    expect(result.entries.map((entry) => entry.userId)).toEqual(['b', 'a'])
  })

  it('respects the limit', () => {
    const rows = ['a', 'b', 'c'].map((userId, index) => row(userId, `2026-09-1${index}`, WON, 3))

    expect(buildLeaderboard(rows, TODAY, 2).entries).toHaveLength(2)
  })

  it('counts losses in wins-independent fields', () => {
    const result = buildLeaderboard(
      [row('a', '2026-09-18', LOST, 6), row('a', '2026-09-20', WON, 2)],
      TODAY,
    )

    expect(result.entries[0]).toMatchObject({ wins: 1, currentStreak: 1, maxStreak: 1 })
    expect(result.totalGames).toBe(2)
  })
})

describe('buildDailyLeaderboard', () => {
  const dailyRow = (overrides: Partial<WordleDailyLeaderboardRow>): WordleDailyLeaderboardRow => ({
    userId: 'user-1',
    login: 'lexa',
    profileImageUrl: 'https://example.com/1.png',
    color: '#123456',
    status: WON,
    attempts: 3,
    ...overrides,
  })

  it('returns an empty result without rows', () => {
    expect(buildDailyLeaderboard([])).toEqual({ entries: [], total: 0 })
  })

  it('puts winners first, sorted by attempts', () => {
    const result = buildDailyLeaderboard([
      dailyRow({ userId: 'l-1', login: 'loser', status: LOST, attempts: 6 }),
      dailyRow({ userId: 'w-4', login: 'dave', attempts: 4 }),
      dailyRow({ userId: 'w-2', login: 'bob', attempts: 2 }),
    ])

    expect(result.entries.map((entry) => entry.userId)).toEqual(['w-2', 'w-4', 'l-1'])
    expect(result.total).toBe(3)
  })

  it('sorts by login when results are equal', () => {
    const result = buildDailyLeaderboard([
      dailyRow({ userId: 'b', login: 'bob', attempts: 3 }),
      dailyRow({ userId: 'a', login: 'anna', attempts: 3 }),
    ])

    expect(result.entries.map((entry) => entry.login)).toEqual(['anna', 'bob'])
  })

  it('sorts losers by attempts as well', () => {
    const result = buildDailyLeaderboard([
      dailyRow({ userId: 'l-5', login: 'five', status: LOST, attempts: 5 }),
      dailyRow({ userId: 'l-1', login: 'one', status: LOST, attempts: 1 }),
      dailyRow({ userId: 'w', login: 'winner', attempts: 6 }),
    ])

    expect(result.entries.map((entry) => entry.userId)).toEqual(['w', 'l-1', 'l-5'])
  })
})
