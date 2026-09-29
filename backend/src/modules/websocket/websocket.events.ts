import type { RecordGenre } from '@/enums'
import type { EventEmitter2 } from '@nestjs/event-emitter'

export const WsEvents = {
  UPDATE_RECORDS: 'update-records',
  UPDATE_SUGGESTIONS: 'update-suggestions',
  UPDATE_QUEUE: 'update-queue',
  UPDATE_LIKES: 'update-likes',
  UPDATE_USERS: 'update-users',
  UPDATE_WORDLE: 'update-wordle',
} as const

export interface UpdateRecordsPayload {
  genre?: RecordGenre | undefined
  id: number
  action: 'created' | 'updated' | 'deleted'
}

export interface UpdateSuggestionsPayload {
  id: number
  action: 'created' | 'updated' | 'deleted'
}

export interface UpdateQueuePayload {
  id: number
  action: 'created' | 'updated' | 'deleted'
}

export interface UpdateLikesPayload {
  recordId: number
  userId: string
  action: 'created' | 'deleted'
}

export interface UpdateUsersPayload {
  userId: string
  action: 'created' | 'updated' | 'deleted'
}

export interface UpdateWordlePayload {
  date: string
  userId: string
  action: 'finished'
}

/** Events the server pushes to clients (Socket.IO contract). */
export type ServerToClientEvents = {
  [WsEvents.UPDATE_RECORDS]: (payload: UpdateRecordsPayload) => void
  [WsEvents.UPDATE_SUGGESTIONS]: (payload: UpdateSuggestionsPayload) => void
  [WsEvents.UPDATE_QUEUE]: (payload: UpdateQueuePayload) => void
  [WsEvents.UPDATE_LIKES]: (payload: UpdateLikesPayload) => void
  [WsEvents.UPDATE_USERS]: (payload: UpdateUsersPayload) => void
  [WsEvents.UPDATE_WORDLE]: (payload: UpdateWordlePayload) => void
}

/** No client -> server events yet. */
export type ClientToServerEvents = Record<never, never>

/** Maps every WsEvents name to its payload so emit calls are checked. */
export interface WsEventMap {
  [WsEvents.UPDATE_RECORDS]: UpdateRecordsPayload
  [WsEvents.UPDATE_SUGGESTIONS]: UpdateSuggestionsPayload
  [WsEvents.UPDATE_QUEUE]: UpdateQueuePayload
  [WsEvents.UPDATE_LIKES]: UpdateLikesPayload
  [WsEvents.UPDATE_USERS]: UpdateUsersPayload
  [WsEvents.UPDATE_WORDLE]: UpdateWordlePayload
}

export function emitWs<K extends keyof WsEventMap>(
  emitter: Pick<EventEmitter2, 'emit'>,
  event: K,
  payload: WsEventMap[K],
): boolean {
  return emitter.emit(event, payload)
}
