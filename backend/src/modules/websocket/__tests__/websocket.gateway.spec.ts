import { describe, expect, it, mock } from 'bun:test'
import { RecordGenre } from '@/enums'
import { WsEvents, type UpdateRecordsPayload } from '@/modules/websocket/websocket.events'
import { WebsocketGateway } from '@/modules/websocket/websocket.gateway'

describe('WebsocketGateway', () => {
  it('forwards update-records events to the socket server', () => {
    const gateway = new WebsocketGateway()
    const emit = mock(() => true)
    gateway.server = { emit } as unknown as typeof gateway.server
    const payload: UpdateRecordsPayload = { genre: RecordGenre.ANIME, id: 1, action: 'created' }

    gateway.handleUpdateRecord(payload)

    expect(emit).toHaveBeenCalledWith(WsEvents.UPDATE_RECORDS, payload)
  })

  it('forwards update-wordle events to the socket server', () => {
    const gateway = new WebsocketGateway()
    const emit = mock(() => true)
    gateway.server = { emit } as unknown as typeof gateway.server

    gateway.handleUpdateWordle({ date: '2026-09-29', userId: 'user-1', action: 'finished' })

    expect(emit).toHaveBeenCalledWith(WsEvents.UPDATE_WORDLE, {
      date: '2026-09-29',
      userId: 'user-1',
      action: 'finished',
    })
  })
})
