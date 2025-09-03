import { Injectable } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'

@Injectable()
@WebSocketGateway({ cors: true, transports: ['websocket'] })
export class WebsocketGateway {
  @WebSocketServer()
  server: Server

  handleConnection(client: Socket) {
    console.log('Client connected', client.id)
  }

  handleDisconnect(client: Socket) {
    console.log('Client disconnected', client.id)
  }

  @OnEvent('WebSocketUpdate')
  handleWebSocketUpdate() {
    console.log('Sending WebSocketUpdate to clients')
    this.server.emit('WebSocketUpdate')
  }
}
