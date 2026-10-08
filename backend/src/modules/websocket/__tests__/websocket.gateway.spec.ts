import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { RecordGenre } from '@/enums'
import {
  WsEvents,
  type UpdateLikesPayload,
  type UpdateQueuePayload,
  type UpdateRecordsPayload,
  type UpdateSuggestionsPayload,
  type UpdateUsersPayload,
  type UpdateWordlePayload,
} from '@/modules/websocket/websocket.events'
import { WebsocketGateway } from '@/modules/websocket/websocket.gateway'

describe('WebsocketGateway', () => {
  let gateway: WebsocketGateway
  let emit: ReturnType<typeof mock>

  beforeEach(() => {
    gateway = new WebsocketGateway()
    emit = mock(() => true)
    gateway.server = { emit } as unknown as typeof gateway.server
  })

  it('forwards update-records events to the socket server', () => {
    const payload: UpdateRecordsPayload = { genre: RecordGenre.ANIME, id: 1, action: 'created' }

    gateway.handleUpdateRecord(payload)

    expect(emit).toHaveBeenCalledWith(WsEvents.UPDATE_RECORDS, payload)
  })

  it('forwards update-queue events to the socket server', () => {
    const payload: UpdateQueuePayload = { id: 2, action: 'updated' }

    gateway.handleUpdateQueue(payload)

    expect(emit).toHaveBeenCalledWith(WsEvents.UPDATE_QUEUE, payload)
  })

  it('forwards update-suggestions events to the socket server', () => {
    const payload: UpdateSuggestionsPayload = { id: 3, action: 'deleted' }

    gateway.handleUpdateSuggestion(payload)

    expect(emit).toHaveBeenCalledWith(WsEvents.UPDATE_SUGGESTIONS, payload)
  })

  it('forwards update-likes events to the socket server', () => {
    const payload: UpdateLikesPayload = { recordId: 4, userId: 'user-1', action: 'created' }

    gateway.handleUpdateLikes(payload)

    expect(emit).toHaveBeenCalledWith(WsEvents.UPDATE_LIKES, payload)
  })

  it('forwards update-users events to the socket server', () => {
    const payload: UpdateUsersPayload = { userId: 'user-2', action: 'updated' }

    gateway.handleUpdateUsers(payload)

    expect(emit).toHaveBeenCalledWith(WsEvents.UPDATE_USERS, payload)
  })

  it('forwards update-wordle events to the socket server', () => {
    const payload: UpdateWordlePayload = {
      date: '2026-09-29',
      userId: 'user-1',
      action: 'finished',
    }

    gateway.handleUpdateWordle(payload)

    expect(emit).toHaveBeenCalledWith(WsEvents.UPDATE_WORDLE, payload)
  })
})
