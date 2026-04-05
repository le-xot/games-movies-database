import { RecordGenre } from '@/enums';

export interface SuggestionRulesDomain {
  genre: RecordGenre;
  permission: boolean;
}
