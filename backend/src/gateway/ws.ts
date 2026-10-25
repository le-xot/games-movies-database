import { isOriginAllowed } from '@backend/utils/cors-origins'
import { WsEvents } from '@gmdb/contract'
import { Elysia } from 'elysia'
import type { DomainEvents } from '@backend/utils/domain-events'

/** Все клиенты сидят в одной комнате: события широковещательные. */
export const WS_TOPIC = 'ws'
export const WS_PATH = '/ws'

const FORBIDDEN = 'origin not allowed'

export interface WsOptions {
  corsOrigins: string[]
}

/**
 * Native WebSocket на `Bun.serve`: без socket.io и engine.io.
 *
 * Клиент ничего не отправляет — только слушает, поэтому `message` пустой.
 * Origin проверяется в `beforeHandle`: он выполняется до апгрейда, то есть
 * чужой сайт не получит даже открытого соединения.
 */
export function wsRoutes({ corsOrigins }: WsOptions) {
  return new Elysia({ name: 'ws' }).ws(WS_PATH, {
    beforeHandle({ request, set }) {
      const origin = request.headers.get('origin') ?? undefined

      if (!isOriginAllowed(origin, corsOrigins)) {
        set.status = 403

        return FORBIDDEN
      }

      return undefined
    },
    open(ws) {
      ws.subscribe(WS_TOPIC)
    },
    message() {
      // Клиент ничего не отправляет: события идут только от сервера.
    },
    close(ws) {
      ws.unsubscribe(WS_TOPIC)
    },
  })
}

/** Куда публиковать: в Elysia это `app.server`, у которого есть `publish`. */
export interface WsPublisher {
  publish(topic: string, data: string): void
}

export interface WsBridgeOptions {
  emitter: Pick<DomainEvents, 'on'>
  /** Сервер появляется только после `listen()`, поэтому берём его лениво. */
  publisher: () => WsPublisher | undefined
}

/**
 * Мост «доменное событие → кадр в сокеты». Доменные сервисы продолжают звать
 * `emitWs(...)`, а гейтвей просто перекладывает те же события в WebSocket.
 */
export function bridgeWsEvents({ emitter, publisher }: WsBridgeOptions) {
  for (const event of Object.values(WsEvents)) {
    emitter.on(event, (payload: unknown) => {
      try {
        publisher()?.publish(WS_TOPIC, JSON.stringify({ event, payload }))
      } catch (error) {
        console.warn(`[gateway] не удалось отправить ${event}: ${String(error)}`)
      }
    })
  }
}
