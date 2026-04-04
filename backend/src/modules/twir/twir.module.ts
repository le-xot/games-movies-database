import { Module } from '@nestjs/common'
import { SuggestionModule } from '../suggestion/suggestion.module'
import { UserModule } from '../user/user.module'
import { TwirController } from './twir.controller'
import { TwirService } from './twir.service'

@Module({
  imports: [UserModule, SuggestionModule],
  providers: [TwirService],
  controllers: [TwirController],
})
export class TwirModule {}
