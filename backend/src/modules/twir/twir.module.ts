import { Module } from '@nestjs/common'
import { SuggestionModule } from '@/modules/suggestion/suggestion.module'
import { TwirController } from '@/modules/twir/twir.controller'
import { TwirService } from '@/modules/twir/twir.service'
import { UserModule } from '@/modules/user/user.module'

@Module({
  imports: [UserModule, SuggestionModule],
  providers: [TwirService],
  controllers: [TwirController],
})
export class TwirModule {}
