import { Injectable, Logger } from '@nestjs/common'
import { SuggestionService } from '../suggestion/suggestion.service'
import { UserService } from '../user/user.service'
import { SuggestionCreateByTwirDTO } from './twir.dto'

@Injectable()
export class TwirService {
  private readonly logger = new Logger(TwirService.name)
  constructor(private readonly user: UserService, private readonly suggestion: SuggestionService) {}

  async createSuggestionWithTwir(data: SuggestionCreateByTwirDTO) {
    this.logger.log(`createSuggestionWithTwir userId=${data.userId} link=${data.link}`)
    let user = await this.user.getUserById(data.userId)
    if (!user) {
      user = await this.user.createUserById(data.userId)
    }
    return await this.suggestion.userSuggest({ link: data.link, userId: user.id })
  }
}
