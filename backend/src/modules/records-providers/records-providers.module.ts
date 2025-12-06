import { PrismaModule } from "@/database/prisma.module"
import { Module } from "@nestjs/common"
import { TwitchModule } from "../twitch/twitch.module"
import { RecordsProvidersService } from "./records-providers.service"

@Module({
  imports: [PrismaModule, TwitchModule],
  providers: [RecordsProvidersService],
  exports: [RecordsProvidersService],
},
)
export class RecordsProvidersModule {}
