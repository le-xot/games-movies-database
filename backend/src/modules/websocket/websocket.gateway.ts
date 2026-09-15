import { Injectable } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets'
import { Server } from 'socket.io'
import {
  WsEvents,
  type UpdateAuctionPayload,
  type UpdateLikesPayload,
  type UpdateQueuePayload,
  type UpdateRecordsPayload,
  type UpdateSuggestionsPayload,
  type UpdateUsersPayload,
} from '@/modules/websocket/websocket.events'

@Injectable()
@WebSocketGateway({ cors: true, transports: ['websocket'] })
export class WebsocketGateway {
  @WebSocketServer()
  server: Server

  @OnEvent(WsEvents.UPDATE_LIKES)
  handleUpdateLikes(payload: UpdateLikesPayload) {
    this.server.emit(WsEvents.UPDATE_LIKES, payload)
  }

  @OnEvent(WsEvents.UPDATE_AUCTION)
  handleUpdateAuction(payload: UpdateAuctionPayload) {
    this.server.emit(WsEvents.UPDATE_AUCTION, payload)
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
}
