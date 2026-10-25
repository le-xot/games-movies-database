import { DrizzleService } from '@backend/database/drizzle.service'
import { RecordGenre } from '@backend/enums'
import { RecordDomain } from '@backend/modules/record/entities/record-domain.entity'
import { SuggestionRulesDomain } from '@backend/modules/suggestion/entities/suggestion-rules.entity'
import { records, suggestionRules } from '@gmd/database/schema'
import { and, eq } from 'drizzle-orm'

export class DrizzleRecordsProvidersRepository {
  constructor(private readonly drizzle: DrizzleService) {}

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
