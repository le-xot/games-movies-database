import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { EventEmitter2, EventEmitterModule } from '@nestjs/event-emitter'
import { Test } from '@nestjs/testing'
import { RecordGenre } from '@/enums'
import { WsEvents } from '@/modules/websocket/websocket.events'
import { WebsocketGateway } from '@/modules/websocket/websocket.gateway'
import type { TestingModule } from '@nestjs/testing'

/** Each WsEvents name paired with a representative payload. */
const eventCases = [
  {
    event: WsEvents.UPDATE_RECORDS,
    payload: { genre: RecordGenre.ANIME, id: 1, action: 'created' },
  },
  { event: WsEvents.UPDATE_QUEUE, payload: { id: 2, action: 'updated' } },
  { event: WsEvents.UPDATE_SUGGESTIONS, payload: { id: 3, action: 'deleted' } },
  { event: WsEvents.UPDATE_LIKES, payload: { recordId: 4, userId: 'user-1', action: 'created' } },
  { event: WsEvents.UPDATE_USERS, payload: { userId: 'user-2', action: 'updated' } },
  {
    event: WsEvents.UPDATE_WORDLE,
    payload: { date: '2026-09-29', userId: 'user-1', action: 'finished' },
  },
] as const

describe('WebsocketGateway @OnEvent wiring', () => {
  let moduleRef: TestingModule
  let emitter: EventEmitter2
  let gateway: WebsocketGateway
  let emit: ReturnType<typeof mock>

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [EventEmitterModule.forRoot()],
      providers: [WebsocketGateway],
    }).compile()
    await moduleRef.init()

    emitter = moduleRef.get(EventEmitter2)
    gateway = moduleRef.get(WebsocketGateway)
    emit = mock(() => true)
    gateway.server = { emit } as unknown as typeof gateway.server
  })

  it('routes every emitted event through its @OnEvent handler to the socket server', () => {
    for (const { event, payload } of eventCases) {
      emit.mockClear()

      emitter.emit(event, payload)

      expect(emit).toHaveBeenCalledWith(event, payload)
    }
  })
})
