import { describe, expect, it, mock } from 'bun:test'
import { bridgeWsEvents, WS_TOPIC } from '@backend/gateway/ws'
import { DomainEvents } from '@backend/utils/domain-events'
import { WsEvents } from '@gmdb/contract'

function setup() {
  const emitter = new DomainEvents()
  const publish = mock((_topic: string, _data: string) => {})

  bridgeWsEvents({ emitter, publisher: () => ({ publish }) })

  return { emitter, publish }
}

describe('bridgeWsEvents', () => {
  it('forwards a domain event as one JSON frame', () => {
    const { emitter, publish } = setup()

    emitter.emit(WsEvents.UPDATE_LIKES, { recordId: 7, userId: 'u1', action: 'created' })

    expect(publish).toHaveBeenCalledWith(
      WS_TOPIC,
      JSON.stringify({
        event: WsEvents.UPDATE_LIKES,
        payload: { recordId: 7, userId: 'u1', action: 'created' },
      }),
    )
  })

  it('forwards every event the contract declares', () => {
    const { emitter, publish } = setup()

    for (const event of Object.values(WsEvents)) {
      emitter.emit(event, { id: 1 })
    }

    expect(publish).toHaveBeenCalledTimes(Object.values(WsEvents).length)
  })

  it('does not blow up when the server is not listening yet', () => {
    const emitter = new DomainEvents()
    bridgeWsEvents({ emitter, publisher: () => undefined })

    expect(() => emitter.emit(WsEvents.UPDATE_USERS, { userId: 'u1' })).not.toThrow()
  })

  it('swallows a failing publish', () => {
    const emitter = new DomainEvents()
    bridgeWsEvents({
      emitter,
      publisher: () => ({
        publish() {
          throw new Error('socket is closed')
        },
      }),
    })

    expect(() => emitter.emit(WsEvents.UPDATE_QUEUE, { id: 1 })).not.toThrow()
  })
})
