import type { RecordGenre, RecordGrade } from './enums'

/**
 * Контракт WebSocket-событий: единственный источник и для бэкенда, и для фронта.
 *
 * Раньше эти типы были продублированы в
 * `backend/src/modules/websocket/websocket.events.ts` и
 * `frontend/src/types/socket-events.ts`, а расхождение ловил отдельный скрипт
 * `scripts/check-socket-contract.ts`. Теперь расходиться нечему.
 */

export const WsEvents = {
  UPDATE_RECORDS: 'update-records',
  UPDATE_SUGGESTIONS: 'update-suggestions',
  UPDATE_QUEUE: 'update-queue',
  UPDATE_LIKES: 'update-likes',
  UPDATE_RATINGS: 'update-ratings',
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

export interface UpdateRatingsPayload {
  recordId: number
  userId: string
  grade: RecordGrade | null
  action: 'created' | 'updated' | 'deleted'
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

/** События, которые сервер отправляет клиенту. */
export type ServerToClientEvents = {
  [WsEvents.UPDATE_RECORDS]: (payload: UpdateRecordsPayload) => void
  [WsEvents.UPDATE_SUGGESTIONS]: (payload: UpdateSuggestionsPayload) => void
  [WsEvents.UPDATE_QUEUE]: (payload: UpdateQueuePayload) => void
  [WsEvents.UPDATE_LIKES]: (payload: UpdateLikesPayload) => void
  [WsEvents.UPDATE_RATINGS]: (payload: UpdateRatingsPayload) => void
  [WsEvents.UPDATE_USERS]: (payload: UpdateUsersPayload) => void
  [WsEvents.UPDATE_WORDLE]: (payload: UpdateWordlePayload) => void
}

/** Клиент ничего на сервер не отправляет. */
export type ClientToServerEvents = Record<never, never>

/** Сопоставление имени события и его payload — для проверки `emit`. */
export interface WsEventMap {
  [WsEvents.UPDATE_RECORDS]: UpdateRecordsPayload
  [WsEvents.UPDATE_SUGGESTIONS]: UpdateSuggestionsPayload
  [WsEvents.UPDATE_QUEUE]: UpdateQueuePayload
  [WsEvents.UPDATE_LIKES]: UpdateLikesPayload
  [WsEvents.UPDATE_RATINGS]: UpdateRatingsPayload
  [WsEvents.UPDATE_USERS]: UpdateUsersPayload
  [WsEvents.UPDATE_WORDLE]: UpdateWordlePayload
}
