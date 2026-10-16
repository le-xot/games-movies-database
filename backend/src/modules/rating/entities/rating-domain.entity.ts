import { RecordGrade } from '@/enums'
import type { SelectRow } from '@gmd/database'

export type RatingDomain = SelectRow<'recordRatings'>

/** Deterministic display order; ties resolve to the earlier grade. */
export const COMMUNITY_GRADE_ORDER: readonly RecordGrade[] = [
  RecordGrade.RECOMMEND,
  RecordGrade.LIKE,
  RecordGrade.BEER,
  RecordGrade.DISLIKE,
]

export type CommunityCounts = Record<RecordGrade, number>

export interface CommunityAggregate {
  counts: CommunityCounts
  total: number
  top: RecordGrade | null
}

/** Community view attached to record reads: public aggregate + own vote. */
export interface RecordCommunityView {
  communityCounts: CommunityCounts
  communityTotal: number
  communityTop: RecordGrade | null
  myGrade: RecordGrade | null
}

export function emptyCommunityCounts(): CommunityCounts {
  return {
    [RecordGrade.DISLIKE]: 0,
    [RecordGrade.BEER]: 0,
    [RecordGrade.LIKE]: 0,
    [RecordGrade.RECOMMEND]: 0,
  }
}

export function getTopGrade(counts: CommunityCounts): RecordGrade | null {
  let top: RecordGrade | null = null
  let topCount = 0
  for (const grade of COMMUNITY_GRADE_ORDER) {
    if (counts[grade] > topCount) {
      top = grade
      topCount = counts[grade]
    }
  }
  return top
}
