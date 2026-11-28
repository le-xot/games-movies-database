import { RecordGrade } from '@/lib/api'
import { GRADE_REPORT_ORDER } from '@/lib/record-vocabulary'

/**
 * Клиентское зеркало `backend/src/modules/rating/entities/rating-domain.entity.ts`.
 * Порядок и тай-брейк обязаны совпадать с бэкендом: используется для
 * оптимистичного обновления счётчиков до прихода ответа сервера.
 */
export const FRIENDS_GRADE_ORDER: readonly RecordGrade[] = GRADE_REPORT_ORDER

export type FriendsCounts = Record<RecordGrade, number>

export function emptyFriendsCounts(): FriendsCounts {
  return {
    [RecordGrade.DISLIKE]: 0,
    [RecordGrade.BEER]: 0,
    [RecordGrade.LIKE]: 0,
    [RecordGrade.RECOMMEND]: 0,
  }
}

export function getTopGrade(counts: FriendsCounts): RecordGrade | null {
  let top: RecordGrade | null = null
  let topCount = 0
  for (const grade of FRIENDS_GRADE_ORDER) {
    if (counts[grade] > topCount) {
      top = grade
      topCount = counts[grade]
    }
  }
  return top
}

export function friendsTotal(counts: FriendsCounts): number {
  return FRIENDS_GRADE_ORDER.reduce((sum, grade) => sum + counts[grade], 0)
}
