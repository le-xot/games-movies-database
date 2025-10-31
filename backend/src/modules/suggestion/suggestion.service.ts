import { PrismaService } from '@/database/prisma.service'
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { $Enums } from '@prisma/client'
import { RecordsProvidersService } from '../records-providers/records-providers.service'

@Injectable()
export class SuggestionService {
  constructor(
    private prisma: PrismaService,
    private recordsProviderService: RecordsProvidersService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async userSuggest(data: { link: string, userId: string }) {
    const limit = await this.prisma.limit.findUnique({
      where: { name: $Enums.LimitType.SUGGESTION },
    })

    const suggestionsCount = await this.prisma.record.count({ where: { userId: data.userId, type: $Enums.LimitType.SUGGESTION } })

    if (suggestionsCount >= limit.quantity) {
      throw new BadRequestException('Достигнут лимит предложений')
    }

    const preparedData = await this.recordsProviderService.prepareData(data)

    await this.prisma.record.create({
      data: {
        ...preparedData,
        link: data.link,
        status: $Enums.RecordStatus.QUEUE,
        type: $Enums.RecordType.SUGGESTION,
        user: { connect: { id: data.userId } },
      },
    })

    this.eventEmitter.emit('WebSocketUpdate')
    return {
      title: preparedData.title,
      genre: preparedData.genre,
    }
  }

  async getSuggestions() {
    return await this.prisma.record.findMany({
      where: { type: $Enums.RecordType.SUGGESTION },
      include: { user: true },
    })
  }

  async deleteUserSuggestion(id: number, userId: string): Promise<void> {
    const suggestion = await this.prisma.record.findUnique({
      where: { id },
    })

    if (!suggestion) {
      throw new NotFoundException('Предложение не найдено')
    }

    if (suggestion.userId !== userId) {
      throw new ForbiddenException('Вы можете удалять только свои предложения')
    }

    if (suggestion.type !== $Enums.RecordType.SUGGESTION) {
      throw new BadRequestException('Запись не является предложением')
    }

    await this.prisma.record.delete({ where: { id } })
    this.eventEmitter.emit('WebSocketUpdate')
  }
}
