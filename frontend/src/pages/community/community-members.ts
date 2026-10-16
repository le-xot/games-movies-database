import { COMMUNITY_GRADE_ORDER, type CommunityCounts } from '@/utils/community-rating'
import type { CommunityMemberEntity, RecordGrade } from '@/lib/api'

export type CommunitySort = 'activity' | 'name'

export interface ProportionSegment {
  grade: RecordGrade
  count: number
  share: number
}

export function countsOf(member: CommunityMemberEntity): CommunityCounts {
  return member.counts as CommunityCounts
}

export function filterMembers(
  members: CommunityMemberEntity[],
  query: string,
): CommunityMemberEntity[] {
  const needle = query.trim().toLowerCase()
  if (!needle) return members
  return members.filter((member) => member.login.toLowerCase().includes(needle))
}

export function sortMembers(
  members: CommunityMemberEntity[],
  sort: CommunitySort,
): CommunityMemberEntity[] {
  return [...members].sort((a, b) => {
    const byLogin = a.login.localeCompare(b.login, 'ru')
    return sort === 'name' ? byLogin : b.total - a.total || byLogin
  })
}

/** Место по активности: userId → 1, 2, 3… независимо от фильтра и сортировки на экране. */
export function activityRanks(members: CommunityMemberEntity[]): Map<string, number> {
  return new Map(
    sortMembers(members, 'activity').map((member, index) => [member.userId, index + 1]),
  )
}

export function proportionSegments(counts: CommunityCounts): ProportionSegment[] {
  const total = COMMUNITY_GRADE_ORDER.reduce((sum, grade) => sum + counts[grade], 0)
  if (total === 0) return []
  return COMMUNITY_GRADE_ORDER.filter((grade) => counts[grade] > 0).map((grade) => ({
    grade,
    count: counts[grade],
    share: counts[grade] / total,
  }))
}
