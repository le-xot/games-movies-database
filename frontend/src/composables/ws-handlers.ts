import {
  FRIENDS_QUERY_KEY,
  STATS_QUERY_KEY,
  SUGGESTION_QUERY_KEY,
  USER_RATINGS_QUERY_KEY,
  WORDLE_LEADERBOARD_KEY,
} from '@/composables/query-keys'
import { GENRES } from '@/lib/genre-registry'
import type { CoalescerKey } from '@/composables/websocket-resync'

export interface WsHandlerDeps {
  /** Инвалидировать группу кэша по её префиксу. */
  invalidate: (key: string[]) => void
  refetchUser: () => void
}

const STATIC_HANDLERS = {
  suggestions: () => SUGGESTION_QUERY_KEY,
  stats: () => STATS_QUERY_KEY,
  wordle: () => WORDLE_LEADERBOARD_KEY,
  friends: () => FRIENDS_QUERY_KEY,
  'user-ratings': () => USER_RATINGS_QUERY_KEY,
} as const

/**
 * Обработчики инвалидации по группам кэша. Жанровые группы берутся из реестра
 * жанров, поэтому новый жанр не требует правки сокета. Полнота покрытия
 * проверяется тестом `ws-handlers.spec.ts`.
 */
export function buildWsHandlers(deps: WsHandlerDeps): Record<CoalescerKey, () => void> {
  const handlers: Record<string, () => void> = {
    user: () => deps.refetchUser(),
  }

  for (const [key, queryKey] of Object.entries(STATIC_HANDLERS)) {
    handlers[key] = () => deps.invalidate([queryKey()])
  }

  for (const entry of GENRES) {
    handlers[`records:${entry.genre}`] = () => deps.invalidate([entry.queryKey])
  }

  return handlers as Record<CoalescerKey, () => void>
}
