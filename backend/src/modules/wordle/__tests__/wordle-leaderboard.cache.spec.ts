import { describe, expect, it, mock } from 'bun:test'
import { WordleLeaderboardCache } from '@/modules/wordle/wordle-leaderboard.cache'
import type { WordleLeaderboardResult } from '@/modules/wordle/wordle.stats'

const VALUE: WordleLeaderboardResult = { entries: [], totalPlayers: 0, totalGames: 0 }

describe('WordleLeaderboardCache', () => {
  it('loads on miss and serves from cache within ttl', async () => {
    const cache = new WordleLeaderboardCache(60_000)
    const loader = mock(() => Promise.resolve(VALUE))

    expect(await cache.get(1_000, loader)).toBe(VALUE)
    expect(await cache.get(59_000, loader)).toBe(VALUE)
    expect(loader).toHaveBeenCalledTimes(1)
  })

  it('reloads after ttl', async () => {
    const cache = new WordleLeaderboardCache(60_000)
    const loader = mock(() => Promise.resolve(VALUE))

    await cache.get(1_000, loader)
    await cache.get(61_001, loader)

    expect(loader).toHaveBeenCalledTimes(2)
  })

  it('reloads after invalidate', async () => {
    const cache = new WordleLeaderboardCache(60_000)
    const loader = mock(() => Promise.resolve(VALUE))

    await cache.get(1_000, loader)
    cache.invalidate()
    await cache.get(2_000, loader)

    expect(loader).toHaveBeenCalledTimes(2)
  })

  it('reloads exactly at the expiry boundary', async () => {
    const cache = new WordleLeaderboardCache(60_000)
    const loader = mock(() => Promise.resolve(VALUE))

    await cache.get(1_000, loader)
    await cache.get(61_000, loader)

    expect(loader).toHaveBeenCalledTimes(2)
  })

  it('shares one loader between concurrent misses', async () => {
    const cache = new WordleLeaderboardCache(60_000)
    const resolvers: Array<(value: WordleLeaderboardResult) => void> = []
    const loader = mock(
      () =>
        new Promise<WordleLeaderboardResult>((resolve) => {
          resolvers.push(resolve)
        }),
    )

    const first = cache.get(1_000, loader)
    const second = cache.get(1_000, loader)

    resolvers[0]?.(VALUE)

    expect(await first).toBe(VALUE)
    expect(await second).toBe(VALUE)
    expect(loader).toHaveBeenCalledTimes(1)
  })

  it('ignores a loader that was invalidated while running', async () => {
    const cache = new WordleLeaderboardCache(60_000)
    const stale: WordleLeaderboardResult = { entries: [], totalPlayers: 1, totalGames: 1 }
    const fresh: WordleLeaderboardResult = { entries: [], totalPlayers: 2, totalGames: 2 }
    const resolvers: Array<(value: WordleLeaderboardResult) => void> = []
    const loader = mock(
      () =>
        new Promise<WordleLeaderboardResult>((resolve) => {
          resolvers.push(resolve)
        }),
    )

    const pending = cache.get(1_000, loader)
    cache.invalidate()
    const reloaded = cache.get(2_000, loader)

    resolvers[1]?.(fresh)
    expect(await reloaded).toBe(fresh)

    resolvers[0]?.(stale)
    await pending

    expect(await cache.get(3_000, loader)).toBe(fresh)
    expect(loader).toHaveBeenCalledTimes(2)
  })
})
