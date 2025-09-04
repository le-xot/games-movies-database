import { Injectable } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets'
import { Server } from 'socket.io'

@Injectable()
@WebSocketGateway({ cors: true, transports: ['websocket'] })
export class WebsocketGateway {
  @WebSocketServer()
  server: Server

  @OnEvent('WebSocketUpdate')
  handleWebSocketUpdate() {
    this.server.emit('WebSocketUpdate')
  }
}
