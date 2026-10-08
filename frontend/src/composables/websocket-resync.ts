import { RecordGenre } from '@/lib/api'

export type RecordsCoalescerKey = `records:${RecordGenre}`
export type CoalescerKey = 'suggestions' | 'stats' | 'user' | 'wordle' | RecordsCoalescerKey

export const RECORD_GENRES = Object.values(RecordGenre)

/** Query groups invalidated after a socket reconnect to catch up on events missed while offline. */
export const WEBSOCKET_RESYNC_KEYS: CoalescerKey[] = [
  'suggestions',
  'stats',
  'user',
  'wordle',
  ...RECORD_GENRES.map((genre) => `records:${genre}` as RecordsCoalescerKey),
]

/**
 * Wraps a resync callback so it runs on every socket `connect` *except* the
 * first one. The first connect is the initial page load (queries already fetch
 * on mount); every later connect is a reconnect that must catch up.
 */
export function createConnectTracker(onReconnect: () => void): () => void {
  let hasConnected = false
  return () => {
    const isReconnect = hasConnected
    hasConnected = true
    if (isReconnect) onReconnect()
  }
}

/** Enqueues every resync key, so the coalescer batches the catch-up refetches. */
export function enqueueResync(coalescer: { enqueue: (key: CoalescerKey) => void }): void {
  for (const key of WEBSOCKET_RESYNC_KEYS) coalescer.enqueue(key)
}
