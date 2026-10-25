import { WsEvents, type WsEventMap } from './ws'

/**
 * Формат кадра в native WebSocket. socket.io возил свои конверты (engine.io),
 * здесь проще говорить чистыми `{ event, payload }` — по одному событию на кадр.
 */
export interface WsMessage<K extends keyof WsEventMap = keyof WsEventMap> {
  event: K
  payload: WsEventMap[K]
}

const KNOWN_EVENTS: ReadonlySet<string> = new Set(Object.values(WsEvents))

/**
 * Разбирает кадр с сервера. Возвращает `null` на мусор вместо исключения:
 * сокет не должен ронять приложение из-за одного битого сообщения.
 */
export function parseWsMessage(raw: unknown): WsMessage | null {
  if (typeof raw !== 'string') return null

  try {
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null

    const message = parsed as { event?: unknown; payload?: unknown }
    if (typeof message.event !== 'string' || !KNOWN_EVENTS.has(message.event)) return null

    return { event: message.event, payload: message.payload } as WsMessage
  } catch {
    return null
  }
}
