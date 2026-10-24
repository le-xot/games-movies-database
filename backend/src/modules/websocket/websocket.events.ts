import type { DomainEvents } from '@/utils/domain-events'
import type { WsEventMap } from '@gmdb/contract'

export * from '@gmdb/contract'

export function emitWs<K extends keyof WsEventMap>(
  emitter: Pick<DomainEvents, 'emit'>,
  event: K,
  payload: WsEventMap[K],
): boolean {
  return emitter.emit(event, payload)
}
