import { LimitType, RecordGenre, RecordType } from '@/enums'
import { LimitDomain } from '@/modules/limit/entities/limit.entity'
import { RecordWithRelations } from '@/modules/record/entities/record-domain.entity'

export interface CreateSuggestionData {
  title: string
  posterUrl: string
  genre: RecordGenre
  link: string
  userId: string
}

export interface SuggestionFilters {
  type: RecordType
}

export abstract class SuggestionRepository {
  abstract findLimit(limitType: LimitType): Promise<LimitDomain | null>
  abstract countUserSuggestions(userId: string, type: RecordType): Promise<number>
  abstract createSuggestion(data: CreateSuggestionData): Promise<RecordWithRelations>
  abstract findSuggestions(filters: SuggestionFilters): Promise<RecordWithRelations[]>
  abstract findSuggestionById(id: number): Promise<RecordWithRelations | null>
  abstract deleteSuggestionWithLikes(recordId: number): Promise<void>
}
