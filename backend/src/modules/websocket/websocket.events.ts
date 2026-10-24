import type { WsEventMap } from '@gmdb/contract'
import type { EventEmitter2 } from '@nestjs/event-emitter'

export * from '@gmdb/contract'

export function emitWs<K extends keyof WsEventMap>(
  emitter: Pick<EventEmitter2, 'emit'>,
  event: K,
  payload: WsEventMap[K],
): boolean {
  return emitter.emit(event, payload)
}
