import { Module } from '@nestjs/common'
import { DrizzleModule } from '@/database/drizzle.module'
import { RecordsProvidersModule } from '@/modules/records-providers/records-providers.module'
import { DrizzleSuggestionRepository } from '@/modules/suggestion/repositories/drizzle-suggestion.repository'
import { SuggestionController } from '@/modules/suggestion/suggestion.controller'
import { SuggestionService } from '@/modules/suggestion/suggestion.service'
import { UserModule } from '@/modules/user/user.module'

@Module({
  imports: [DrizzleModule, UserModule, RecordsProvidersModule],
  providers: [SuggestionService, DrizzleSuggestionRepository],
  controllers: [SuggestionController],
  exports: [SuggestionService],
})
export class SuggestionModule {}
