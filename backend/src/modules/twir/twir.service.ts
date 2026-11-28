import { SuggestionService } from '@backend/modules/suggestion/suggestion.service'
import { UserService } from '@backend/modules/user/user.service'
import { NotFoundError } from '@backend/utils/errors'
import { Logger } from '@backend/utils/logger'

export class TwirService {
  private readonly logger = new Logger(TwirService.name)
  constructor(
    private readonly user: UserService,
    private readonly suggestion: SuggestionService,
  ) {}

  async createSuggestionWithTwir(data: { userId: string; link: string }) {
    this.logger.log(`createSuggestionWithTwir userId=${data.userId} link=${data.link}`)
    const user = await this.user.getUserById(data.userId)
    if (!user) {
      throw new NotFoundError(`User with id ${data.userId} not found`)
    }
    return await this.suggestion.userSuggest({ link: data.link, userId: user.id })
  }
}
