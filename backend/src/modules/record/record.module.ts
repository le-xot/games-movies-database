import { PrismaModule } from "@/database/prisma.module"
import { Module } from "@nestjs/common"
import { RecordsProvidersModule } from "../records-providers/records-providers.module"
import { UserModule } from "../user/user.module"
import { WebsocketModule } from "../websocket/websocket.module"
import { RecordController } from "./record.controller"
import { RecordService } from "./record.service"

@Module({
  imports: [PrismaModule, UserModule, RecordsProvidersModule, WebsocketModule],
  providers: [RecordService],
  controllers: [RecordController],
})
export class RecordModule {}
