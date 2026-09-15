import { Module } from '@nestjs/common'
import { DrizzleModule } from '@/database/drizzle.module'
import { RecordsProvidersModule } from '@/modules/records-providers/records-providers.module'
import { DrizzleSuggestionRepository } from '@/modules/suggestion/repositories/drizzle-suggestion.repository'
import { SuggestionRepository } from '@/modules/suggestion/repositories/suggestion.repository'
import { SuggestionController } from '@/modules/suggestion/suggestion.controller'
import { SuggestionService } from '@/modules/suggestion/suggestion.service'
import { UserModule } from '@/modules/user/user.module'
import { WebsocketModule } from '@/modules/websocket/websocket.module'

@Module({
  imports: [DrizzleModule, UserModule, RecordsProvidersModule, WebsocketModule],
  providers: [
    SuggestionService,
    { provide: SuggestionRepository, useClass: DrizzleSuggestionRepository },
  ],
  controllers: [SuggestionController],
  exports: [SuggestionService],
})
export class SuggestionModule {}
