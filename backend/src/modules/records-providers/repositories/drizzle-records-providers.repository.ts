import { records, suggestionRules } from '@gmd/database/schema'
import { Injectable } from '@nestjs/common'
import { and, eq } from 'drizzle-orm'
import { DrizzleService } from '@/database/drizzle.service'
import { RecordGenre } from '@/enums'
import { RecordDomain } from '@/modules/record/entities/record-domain.entity'
import { SuggestionRulesDomain } from '@/modules/suggestion/entities/suggestion-rules.entity'
import { RecordsProvidersRepository } from './records-providers.repository'

@Injectable()
export class DrizzleRecordsProvidersRepository extends RecordsProvidersRepository {
  constructor(private readonly drizzle: DrizzleService) {
    super()
  }

  async findRecordByLinkAndGenre(link: string, genre: RecordGenre): Promise<RecordDomain | null> {
    return (
      (await this.drizzle.db.query.records.findFirst({
        where: and(eq(records.link, link), eq(records.genre, genre)),
      })) ?? null
    )
  }

  async findSuggestionRulesByGenre(genre: RecordGenre): Promise<SuggestionRulesDomain | null> {
    return (
      (await this.drizzle.db.query.suggestionRules.findFirst({
        where: eq(suggestionRules.genre, genre),
      })) ?? null
    )
  }
}
