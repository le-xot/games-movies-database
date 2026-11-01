import { describe, expect, it, mock } from 'bun:test'
import { WsEvents } from '@gmdb/contract'
import {
  WEBSOCKET_RESYNC_KEYS,
  createConnectTracker,
  enqueueResync,
  invalidationKeysFor,
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
      expect.arrayContaining(['suggestions', 'stats', 'user', 'wordle', 'friends', 'user-ratings']),
    )
  })
})

describe('invalidationKeysFor', () => {
  it('refreshes suggestions, stats and the changed genre on a record update', () => {
    expect(
      invalidationKeysFor({
        event: WsEvents.UPDATE_RECORDS,
        payload: { id: 7, action: 'updated', genre: RecordGenre.ANIME },
      }),
    ).toEqual(['stats', 'suggestions', 'user-ratings', 'records:ANIME'])
  })

  it('refreshes every genre when a record update arrives without a genre', () => {
    const keys = invalidationKeysFor({
      event: WsEvents.UPDATE_RECORDS,
      payload: { id: 7, action: 'deleted' },
    })

    for (const genre of Object.values(RecordGenre)) {
      expect(keys).toContain(`records:${genre}`)
    }
    expect(keys).toContain('suggestions')
  })

  it('refreshes suggestions on like and suggestion events', () => {
    expect(
      invalidationKeysFor({
        event: WsEvents.UPDATE_LIKES,
        payload: { recordId: 7, userId: 'u1', action: 'created' },
      }),
    ).toEqual(['suggestions'])

    expect(
      invalidationKeysFor({
        event: WsEvents.UPDATE_SUGGESTIONS,
        payload: { id: 1, action: 'created' },
      }),
    ).toEqual(['suggestions'])
  })

  it('refreshes ratings consumers on a rating change', () => {
    const keys = invalidationKeysFor({
      event: WsEvents.UPDATE_RATINGS,
      payload: { recordId: 7, userId: 'u1', grade: null, action: 'deleted' },
    })

    expect(keys).toContain('friends')
    expect(keys).toContain('user-ratings')
    for (const genre of Object.values(RecordGenre)) {
      expect(keys).toContain(`records:${genre}`)
    }
  })

  it('refreshes suggestions and stats on a queue change', () => {
    expect(
      invalidationKeysFor({ event: WsEvents.UPDATE_QUEUE, payload: { id: 1, action: 'updated' } }),
    ).toEqual(['suggestions', 'stats'])
  })

  it('refreshes everything that renders user data on a user change', () => {
    expect(
      invalidationKeysFor({
        event: WsEvents.UPDATE_USERS,
        payload: { userId: 'u1', action: 'updated' },
      }),
    ).toEqual(['user', 'wordle', 'suggestions', 'friends', 'user-ratings'])
  })

  it('refreshes the leaderboard on a wordle change', () => {
    expect(
      invalidationKeysFor({
        event: WsEvents.UPDATE_WORDLE,
        payload: { date: '2026-11-01', userId: 'u1', action: 'finished' },
      }),
    ).toEqual(['wordle'])
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
