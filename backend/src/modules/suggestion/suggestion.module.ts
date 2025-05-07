import { Module } from '@nestjs/common'
import { PrismaModule } from 'src/database/prisma.module'
import { UserModule } from '../user/user.module'
import { SuggestionController } from './suggestion.controller'
import { SuggestionService } from './suggestion.service'

@Module({
  imports: [PrismaModule, UserModule],
  providers: [SuggestionService],
  controllers: [SuggestionController],
})
export class SuggestionModule {}
