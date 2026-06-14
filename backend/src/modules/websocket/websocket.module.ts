import { Module } from '@nestjs/common'
import { WebsocketGateway } from '@/modules/websocket/websocket.gateway'

@Module({
  providers: [WebsocketGateway],
})
export class WebsocketModule {}
