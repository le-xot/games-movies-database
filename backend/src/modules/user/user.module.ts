import { PrismaModule } from "@/database/prisma.module"
import { Module } from "@nestjs/common"
import { CustomJwtModule } from "../jwt/jwt.module"
import { TwitchModule } from "../twitch/twitch.module"
import { WebsocketModule } from "../websocket/websocket.module"
import { UserController } from "./user.controller"
import { UserService } from "./user.service"

@Module({
  imports: [CustomJwtModule, PrismaModule, TwitchModule, WebsocketModule],
  providers: [UserService],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
