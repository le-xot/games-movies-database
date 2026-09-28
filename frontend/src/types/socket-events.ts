import type { RecordGenre } from '@/lib/api'

/**
 * Зеркало backend-контракта `backend/src/modules/websocket/websocket.events.ts`.
 * При изменении событий на бэкенде — обновить здесь и в `socket-events.check.ts`.
 */
export const WsEvents = {
  UPDATE_RECORDS: 'update-records',
  UPDATE_SUGGESTIONS: 'update-suggestions',
  UPDATE_QUEUE: 'update-queue',
  UPDATE_LIKES: 'update-likes',
  UPDATE_USERS: 'update-users',
  UPDATE_WORDLE: 'update-wordle',
} as const

export interface UpdateRecordsPayload {
  genre?: RecordGenre
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

export type ServerToClientEvents = {
  [WsEvents.UPDATE_RECORDS]: (payload: UpdateRecordsPayload) => void
  [WsEvents.UPDATE_SUGGESTIONS]: (payload: UpdateSuggestionsPayload) => void
  [WsEvents.UPDATE_QUEUE]: (payload: UpdateQueuePayload) => void
  [WsEvents.UPDATE_LIKES]: (payload: UpdateLikesPayload) => void
  [WsEvents.UPDATE_USERS]: (payload: UpdateUsersPayload) => void
  [WsEvents.UPDATE_WORDLE]: (payload: UpdateWordlePayload) => void
}

/** Клиент ничего на сервер не отправляет. */
export type ClientToServerEvents = Record<never, never>
