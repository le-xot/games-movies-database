import { Injectable } from '@nestjs/common'
import type { WordleLeaderboardResult } from '@/modules/wordle/wordle.stats'

export const WORDLE_LEADERBOARD_TTL_MS = 60_000

@Injectable()
export class WordleLeaderboardCache {
  private value: WordleLeaderboardResult | null = null
  private expiresAt = 0
  private inflight: Promise<WordleLeaderboardResult> | null = null
  private generation = 0

  constructor(private readonly ttlMs: number = WORDLE_LEADERBOARD_TTL_MS) {}

  get(
    nowMs: number,
    loader: () => Promise<WordleLeaderboardResult>,
  ): Promise<WordleLeaderboardResult> {
    if (this.value && nowMs < this.expiresAt) return Promise.resolve(this.value)
    if (this.inflight) return this.inflight

    const generation = this.generation
    const pending = loader()
      .then((value) => {
        if (generation === this.generation) {
          this.value = value
          this.expiresAt = nowMs + this.ttlMs
        }
        return value
      })
      .finally(() => {
        if (this.inflight === pending) this.inflight = null
      })

    this.inflight = pending
    return pending
  }

  invalidate(): void {
    this.value = null
    this.expiresAt = 0
    this.generation += 1
    this.inflight = null
  }
}
