import { Injectable } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets'
import { Server } from 'socket.io'
import type {
  UpdateAuctionPayload,
  UpdateLikesPayload,
  UpdateQueuePayload,
  UpdateRecordsPayload,
  UpdateSuggestionsPayload,
  UpdateUsersPayload,
} from '@/modules/websocket/websocket.events'

@Injectable()
@WebSocketGateway({ cors: true, transports: ['websocket'] })
export class WebsocketGateway {
  @WebSocketServer()
  server: Server

  @OnEvent('update-likes')
  handleUpdateLikes(payload: UpdateLikesPayload) {
    this.server.emit('update-likes', payload)
  }

  @OnEvent('update-auction')
  handleUpdateAuction(payload: UpdateAuctionPayload) {
    this.server.emit('update-auction', payload)
  }

  @OnEvent('update-queue')
  handleUpdateQueue(payload: UpdateQueuePayload) {
    this.server.emit('update-queue', payload)
  }

  @OnEvent('update-suggestions')
  handleUpdateSuggestion(payload: UpdateSuggestionsPayload) {
    this.server.emit('update-suggestions', payload)
  }

  @OnEvent('update-records')
  handleUpdateRecord(payload: UpdateRecordsPayload) {
    this.server.emit('update-records', payload)
  }

  @OnEvent('update-users')
  handleUpdateUsers(payload: UpdateUsersPayload) {
    this.server.emit('update-users', payload)
  }
}
