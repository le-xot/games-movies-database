import { Injectable, Logger } from '@nestjs/common'
import { SuggestionService } from '@/modules/suggestion/suggestion.service'
import { SuggestionCreateByTwirDTO } from '@/modules/twir/twir.dto'
import { UserService } from '@/modules/user/user.service'

@Injectable()
export class TwirService {
  private readonly logger = new Logger(TwirService.name)
  constructor(
    private readonly user: UserService,
    private readonly suggestion: SuggestionService,
  ) {}

  async createSuggestionWithTwir(data: SuggestionCreateByTwirDTO) {
    this.logger.log(`createSuggestionWithTwir userId=${data.userId} link=${data.link}`)
    let user = await this.user.getUserById(data.userId)
    if (!user) {
      user = await this.user.createUserById(data.userId)
    }
    return await this.suggestion.userSuggest({ link: data.link, userId: user.id })
  }
}
