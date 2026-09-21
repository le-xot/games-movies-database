import { Injectable } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets'
import { Server } from 'socket.io'
import {
  WsEvents,
  type UpdateLikesPayload,
  type UpdateQueuePayload,
  type UpdateRecordsPayload,
  type UpdateSuggestionsPayload,
  type UpdateUsersPayload,
  type UpdateWordlePayload,
} from '@/modules/websocket/websocket.events'
import { isOriginAllowed, parseCorsOrigins } from '@/utils/cors-origins'
import { env } from '@/utils/enviroments'

const allowedOrigins = parseCorsOrigins(env.CORS_ORIGINS)

@Injectable()
@WebSocketGateway({
  cors: { origin: allowedOrigins },
  transports: ['websocket'],
  allowRequest: (request, callback) => {
    callback(null, isOriginAllowed(request.headers.origin, allowedOrigins))
  },
})
export class WebsocketGateway {
  @WebSocketServer()
  server: Server

  @OnEvent(WsEvents.UPDATE_LIKES)
  handleUpdateLikes(payload: UpdateLikesPayload) {
    this.server.emit(WsEvents.UPDATE_LIKES, payload)
  }

  @OnEvent(WsEvents.UPDATE_QUEUE)
  handleUpdateQueue(payload: UpdateQueuePayload) {
    this.server.emit(WsEvents.UPDATE_QUEUE, payload)
  }

  @OnEvent(WsEvents.UPDATE_SUGGESTIONS)
  handleUpdateSuggestion(payload: UpdateSuggestionsPayload) {
    this.server.emit(WsEvents.UPDATE_SUGGESTIONS, payload)
  }

  @OnEvent(WsEvents.UPDATE_RECORDS)
  handleUpdateRecord(payload: UpdateRecordsPayload) {
    this.server.emit(WsEvents.UPDATE_RECORDS, payload)
  }

  @OnEvent(WsEvents.UPDATE_USERS)
  handleUpdateUsers(payload: UpdateUsersPayload) {
    this.server.emit(WsEvents.UPDATE_USERS, payload)
  }

  @OnEvent(WsEvents.UPDATE_WORDLE)
  handleUpdateWordle(payload: UpdateWordlePayload) {
    this.server.emit(WsEvents.UPDATE_WORDLE, payload)
  }
}
