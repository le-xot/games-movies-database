import type { RecordEntity, RecordGrade } from '@/lib/api'

/** Запись в карточке медиатеки: к сущности могут прийти чужие оценки/логин. */
export type MediaCardItem = RecordEntity & {
  userGrade?: RecordGrade | null
  userLogin?: string | null
}
