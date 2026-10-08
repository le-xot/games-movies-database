import { describe, expect, it, mock } from 'bun:test'
import {
  WEBSOCKET_RESYNC_KEYS,
  createConnectTracker,
  enqueueResync,
} from '@/composables/websocket-resync'
import { RecordGenre } from '@/lib/api'

describe('createConnectTracker', () => {
  it('does not resync on the first connect', () => {
    const onReconnect = mock(() => {})
    const track = createConnectTracker(onReconnect)

    track()

    expect(onReconnect).not.toHaveBeenCalled()
  })

  it('resyncs on every connect after the first', () => {
    const onReconnect = mock(() => {})
    const track = createConnectTracker(onReconnect)

    track()
    track()
    track()

    expect(onReconnect).toHaveBeenCalledTimes(2)
  })
})

describe('WEBSOCKET_RESYNC_KEYS', () => {
  it('covers records for every genre plus the shared query groups', () => {
    for (const genre of Object.values(RecordGenre)) {
      expect(WEBSOCKET_RESYNC_KEYS).toContain(`records:${genre}`)
    }
    expect(WEBSOCKET_RESYNC_KEYS).toEqual(
      expect.arrayContaining(['suggestions', 'stats', 'user', 'wordle']),
    )
  })
})

describe('enqueueResync', () => {
  it('enqueues every resync key', () => {
    const enqueue = mock(() => {})

    enqueueResync({ enqueue })

    expect(enqueue).toHaveBeenCalledTimes(WEBSOCKET_RESYNC_KEYS.length)
    for (const key of WEBSOCKET_RESYNC_KEYS) {
      expect(enqueue).toHaveBeenCalledWith(key)
    }
  })
})
