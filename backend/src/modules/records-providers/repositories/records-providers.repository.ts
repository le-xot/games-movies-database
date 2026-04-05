import { RecordGenre } from '@/enums'
import { RecordDomain } from '@/modules/record/entities/record-domain.entity'
import { SuggestionRulesDomain } from '@/modules/suggestion/entities/suggestion-rules.entity'

export abstract class RecordsProvidersRepository {
  abstract findRecordByLinkAndGenre(
    link: string,
    genre: RecordGenre,
  ): Promise<RecordDomain | null>

  abstract findSuggestionRulesByGenre(genre: RecordGenre): Promise<SuggestionRulesDomain | null>
}
