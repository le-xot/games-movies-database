import { Injectable } from "@nestjs/common"
import { OnEvent } from "@nestjs/event-emitter"
import { WebSocketGateway, WebSocketServer } from "@nestjs/websockets"
import { $Enums } from "@prisma/client"
import { Server } from "socket.io"

@Injectable()
@WebSocketGateway({ cors: true, transports: ["websocket"] })
export class WebsocketGateway {
  @WebSocketServer()
  server: Server

  @OnEvent("update-likes")
  handleUpdateLikes() {
    this.server.emit("update-likes")
  }

  @OnEvent("update-auction")
  handleUpdateAuction() {
    this.server.emit("update-auction")
  }

  @OnEvent("update-queue")
  handleUpdateQueue() {
    this.server.emit("update-queue")
  }

  @OnEvent("update-suggestions")
  handleUpdateSuggestion() {
    this.server.emit("update-suggestions")
  }

  @OnEvent("update-records")
  handleUpdateRecord(payload: { genre: $Enums.RecordGenre }) {
    this.server.emit("update-records", payload)
  }

  @OnEvent("update-users")
  handleUpdateUsers() {
    this.server.emit("update-users")
  }
}
