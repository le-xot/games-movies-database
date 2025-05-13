import { Module } from '@nestjs/common'
import { PrismaModule } from 'src/database/prisma.module'
import { RecordsProvidersModule } from '../records-providers/records-providers.module'
import { UserModule } from '../user/user.module'
import { SuggestionController } from './suggestion.controller'
import { SuggestionService } from './suggestion.service'

@Module({
  imports: [PrismaModule, UserModule, RecordsProvidersModule],
  providers: [SuggestionService],
  controllers: [SuggestionController],
  exports: [SuggestionService],
})
export class SuggestionModule {}
