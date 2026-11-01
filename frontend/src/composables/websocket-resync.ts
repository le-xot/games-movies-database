import { WsEvents, type WsMessage } from '@gmdb/contract'
import { RecordGenre } from '@/lib/api'

export type RecordsCoalescerKey = `records:${RecordGenre}`
export type CoalescerKey =
  | 'suggestions'
  | 'stats'
  | 'user'
  | 'wordle'
  | 'friends'
  | 'user-ratings'
  | RecordsCoalescerKey

export const RECORD_GENRES = Object.values(RecordGenre)

/** Query groups invalidated after a socket reconnect to catch up on events missed while offline. */
export const WEBSOCKET_RESYNC_KEYS: CoalescerKey[] = [
  'suggestions',
  'stats',
  'user',
  'wordle',
  'friends',
  'user-ratings',
  ...RECORD_GENRES.map((genre) => `records:${genre}` as RecordsCoalescerKey),
]

/** Один жанр из payload или все сразу, если сервер жанр не прислал. */
function recordKeys(genre?: RecordGenre | null): RecordsCoalescerKey[] {
  if (genre) return [`records:${genre}`]

  return RECORD_GENRES.map((item) => `records:${item}` as RecordsCoalescerKey)
}

/**
 * Какие группы кэша устаревают от кадра с сервера.
 *
 * Маппинг живёт здесь, а не в обработчике сокета: так его видно целиком и можно
 * покрыть тестом. Правило простое — инвалидируем всё, что читает изменившиеся
 * данные, а не только открытую страницу.
 */
export function invalidationKeysFor(message: WsMessage): CoalescerKey[] {
  switch (message.event) {
    case WsEvents.UPDATE_RECORDS: {
      const payload = message.payload as { genre?: RecordGenre } | undefined

      // «Советы» строятся из тех же записей (все SUGGESTION + WRITTEN со статусами
      // QUEUE/PROGRESS), «Мои оценки» показывают сами записи — их тоже обновляем.
      return ['stats', 'suggestions', 'user-ratings', ...recordKeys(payload?.genre)]
    }
    case WsEvents.UPDATE_LIKES:
    case WsEvents.UPDATE_SUGGESTIONS:
      return ['suggestions']
    case WsEvents.UPDATE_RATINGS:
      // Оценки видны в списках жанров, в сводке друзей и в «Моих оценках».
      return ['friends', 'user-ratings', ...recordKeys()]
    case WsEvents.UPDATE_QUEUE:
      return ['suggestions', 'stats']
    case WsEvents.UPDATE_USERS:
      // Имя и аватар пользователя есть в «Советах», «Друзьях» и «Моих оценках».
      return ['user', 'wordle', 'suggestions', 'friends', 'user-ratings']
    case WsEvents.UPDATE_WORDLE:
      return ['wordle']
    default:
      return []
  }
}

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
