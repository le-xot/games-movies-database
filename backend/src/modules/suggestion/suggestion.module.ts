import { PrismaModule } from "@/database/prisma.module"
import { Module } from "@nestjs/common"
import { RecordsProvidersModule } from "../records-providers/records-providers.module"
import { UserModule } from "../user/user.module"
import { WebsocketModule } from "../websocket/websocket.module"
import { SuggestionController } from "./suggestion.controller"
import { SuggestionService } from "./suggestion.service"

@Module({
  imports: [PrismaModule, UserModule, RecordsProvidersModule, WebsocketModule],
  providers: [SuggestionService],
  controllers: [SuggestionController],
  exports: [SuggestionService],
})
export class SuggestionModule {}
