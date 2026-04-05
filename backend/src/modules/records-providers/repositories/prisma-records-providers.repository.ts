import { Injectable } from '@nestjs/common'
import { PrismaService } from '@/database/prisma.service'
import { RecordGenre } from '@/enums'
import { RecordDomain } from '@/modules/record/entities/record-domain.entity'
import { SuggestionRulesDomain } from '@/modules/suggestion/entities/suggestion-rules.entity'
import { RecordsProvidersRepository } from './records-providers.repository'

@Injectable()
export class PrismaRecordsProvidersRepository extends RecordsProvidersRepository {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async findRecordByLinkAndGenre(link: string, genre: RecordGenre): Promise<RecordDomain | null> {
    return await this.prisma.record.findFirst({
      where: { link, genre },
    }) as unknown as RecordDomain | null
  }

  async findSuggestionRulesByGenre(genre: RecordGenre): Promise<SuggestionRulesDomain | null> {
    return await this.prisma.suggestionRules.findUnique({
      where: { genre },
    }) as unknown as SuggestionRulesDomain | null
  }
}
