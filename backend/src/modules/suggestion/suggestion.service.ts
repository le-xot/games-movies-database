import { LimitType, RecordGenre, RecordStatus, RecordType } from '@backend/enums'
import { RecordsProvidersService } from '@backend/modules/records-providers/records-providers.service'
import { DrizzleSuggestionRepository } from '@backend/modules/suggestion/repositories/drizzle-suggestion.repository'
import { WsEvents, emitWs } from '@backend/modules/websocket/websocket.events'
import { DomainEvents } from '@backend/utils/domain-events'
import { BadRequestException, ForbiddenException, NotFoundException } from '@backend/utils/errors'
import { Logger } from '@backend/utils/logger'

export class SuggestionService {
  private readonly logger = new Logger(SuggestionService.name)
  constructor(
    private readonly suggestionRepository: DrizzleSuggestionRepository,
    private recordsProviderService: RecordsProvidersService,
    private readonly eventEmitter: DomainEvents,
  ) {}

  async userSuggest(data: {
    link: string
    userId: string
  }): Promise<{ title: string; genre: RecordGenre }> {
    this.logger.log(`User suggesting link=${data.link} userId=${data.userId}`)
    const limit = await this.suggestionRepository.findLimit(LimitType.SUGGESTION)
    if (!limit) {
      throw new BadRequestException('Лимит предложений не настроен')
    }

    const suggestionsCount = await this.suggestionRepository.countUserSuggestions(
      data.userId,
      RecordType.SUGGESTION,
    )

    if (suggestionsCount >= limit.quantity) {
      throw new BadRequestException('Достигнут лимит предложений')
    }

    const preparedData = await this.recordsProviderService.prepareData({
      link: data.link,
    })

    const createdRecord = await this.suggestionRepository.createSuggestion(
      {
        title: preparedData.title,
        posterUrl: preparedData.posterUrl,
        genre: preparedData.genre,
        link: preparedData.link,
      },
      data.userId,
    )

    emitWs(this.eventEmitter, WsEvents.UPDATE_SUGGESTIONS, {
      id: createdRecord.id,
      action: 'created',
    })
    this.logger.log(`Suggestion created title=${preparedData.title} genre=${preparedData.genre}`)
    return {
      title: preparedData.title,
      genre: preparedData.genre,
    }
  }

  getSuggestions() {
    return this.suggestionRepository.findSuggestions({
      types: [RecordType.SUGGESTION, RecordType.WRITTEN],
      statuses: [RecordStatus.QUEUE, RecordStatus.PROGRESS],
    })
  }

  async deleteUserSuggestion(id: number, userId: string): Promise<void> {
    const suggestion = await this.suggestionRepository.findSuggestionById(id)

    if (!suggestion) {
      throw new NotFoundException('Предложение не найдено')
    }

    const owner = await this.suggestionRepository.findSuggestionOwner(id)
    if (!owner || owner.userId !== userId) {
      throw new ForbiddenException('Вы можете удалять только свои предложения')
    }

    if (suggestion.type !== RecordType.SUGGESTION) {
      throw new BadRequestException('Запись не является предложением')
    }

    await this.suggestionRepository.deleteSuggestionWithLikes(id)

    emitWs(this.eventEmitter, WsEvents.UPDATE_SUGGESTIONS, {
      id,
      action: 'deleted',
    })
  }
}
