import { BadRequestException, Injectable } from '@nestjs/common'
import { $Enums, Limit } from '@prisma/client'
import { PrismaService } from 'src/database/prisma.service'
import { RecordsProvidersService } from '../records-providers/records-providers.service'

@Injectable()
export class SuggestionService {
  constructor(
    private prisma: PrismaService,

    private recordsProviderService: RecordsProvidersService,
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

    return this.prisma.record.create({
      data: {
        ...preparedData,
        link: data.link,
        status: $Enums.RecordStatus.QUEUE,
        type: $Enums.RecordType.SUGGESTION,
        user: { connect: { id: data.userId } },
      },
    })
  }

  async getSuggestions() {
    const suggestions = await this.prisma.record.findMany({
      where: { type: $Enums.RecordType.SUGGESTION },
      include: { user: true },
    })
    return suggestions
  }

  changeSuggestionLimit(limit: number): Promise<Limit> {
    return this.prisma.limit.update({
      where: { name: 'SUGGESTION' },
      data: { quantity: limit },
    })
  }
}
