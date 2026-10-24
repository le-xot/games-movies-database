import { RecordGrade } from '@backend/enums'
import type { SelectRow } from '@gmd/database'

export type RatingDomain = SelectRow<'recordRatings'>

/** Deterministic display order; ties resolve to the earlier grade. */
export const FRIENDS_GRADE_ORDER: readonly RecordGrade[] = [
  RecordGrade.RECOMMEND,
  RecordGrade.LIKE,
  RecordGrade.BEER,
  RecordGrade.DISLIKE,
]

export type FriendsCounts = Record<RecordGrade, number>

export interface FriendsAggregate {
  counts: FriendsCounts
  total: number
  top: RecordGrade | null
}

/** Friends view attached to record reads: public aggregate + own vote. */
export interface RecordFriendsView {
  friendsCounts: FriendsCounts
  friendsTotal: number
  friendsTop: RecordGrade | null
  myGrade: RecordGrade | null
}

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
