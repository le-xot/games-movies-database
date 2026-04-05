import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { LimitType, RecordType } from '@/enums'
import { RecordsProvidersService } from '@/modules/records-providers/records-providers.service'
import type { RecordEntity } from '@/modules/record/record.entity'
import { SuggestionRepository } from '@/modules/suggestion/repositories/suggestion.repository'
import type { UpdateSuggestionsPayload } from '@/modules/websocket/websocket.events'

@Injectable()
export class SuggestionService {
  private readonly logger = new Logger(SuggestionService.name)
  constructor(
    private readonly suggestionRepository: SuggestionRepository,
    private recordsProviderService: RecordsProvidersService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async userSuggest(data: { link: string; userId: string }) {
    this.logger.log(`User suggesting link=${data.link} userId=${data.userId}`)
    const limit = await this.suggestionRepository.findLimit(LimitType.SUGGESTION)

    const suggestionsCount = await this.suggestionRepository.countUserSuggestions(
      data.userId,
      RecordType.SUGGESTION,
    )

    if (suggestionsCount >= limit.value) {
      throw new BadRequestException('Достигнут лимит предложений')
    }

    const preparedData = await this.recordsProviderService.prepareData(data)

    const createdRecord = await this.suggestionRepository.createSuggestion({
      title: preparedData.title,
      posterUrl: preparedData.posterUrl,
      genre: preparedData.genre,
      link: data.link,
      userId: data.userId,
    })

    this.eventEmitter.emit('update-suggestions', {
      id: createdRecord.id,
      action: 'created',
    } satisfies UpdateSuggestionsPayload)
    this.logger.log(`Suggestion created title=${preparedData.title} genre=${preparedData.genre}`)
    return {
      title: preparedData.title,
      genre: preparedData.genre,
    }
  }

  getSuggestions() {
    return this.suggestionRepository.findSuggestions({
      type: RecordType.SUGGESTION,
    }) as unknown as Promise<RecordEntity[]>
  }

  async deleteUserSuggestion(id: number, userId: string): Promise<void> {
    const suggestion = await this.suggestionRepository.findSuggestionById(id)

    if (!suggestion) {
      throw new NotFoundException('Предложение не найдено')
    }

    if (suggestion.userId !== userId) {
      throw new ForbiddenException('Вы можете удалять только свои предложения')
    }

    if (suggestion.type !== RecordType.SUGGESTION) {
      throw new BadRequestException('Запись не является предложением')
    }

    await this.suggestionRepository.deleteSuggestionWithLikes(id)

    this.eventEmitter.emit('update-suggestions', {
      id,
      action: 'deleted',
    } satisfies UpdateSuggestionsPayload)
  }
}
