import { Module } from '@nestjs/common'
import { PrismaModule } from '@/database/prisma.module'
import { RecordsProvidersModule } from '@/modules/records-providers/records-providers.module'
import { SuggestionController } from '@/modules/suggestion/suggestion.controller'
import { SuggestionService } from '@/modules/suggestion/suggestion.service'
import { PrismaSuggestionRepository } from '@/modules/suggestion/repositories/prisma-suggestion.repository'
import { SuggestionRepository } from '@/modules/suggestion/repositories/suggestion.repository'
import { UserModule } from '@/modules/user/user.module'
import { WebsocketModule } from '@/modules/websocket/websocket.module'

@Module({
  imports: [PrismaModule, UserModule, RecordsProvidersModule, WebsocketModule],
  providers: [
    SuggestionService,
    { provide: SuggestionRepository, useClass: PrismaSuggestionRepository },
  ],
  controllers: [SuggestionController],
  exports: [SuggestionService],
})
export class SuggestionModule {}
