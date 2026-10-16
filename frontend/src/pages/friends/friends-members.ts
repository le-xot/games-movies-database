import { FRIENDS_GRADE_ORDER, type FriendsCounts } from '@/utils/friends-rating'
import type { FriendsMemberEntity, RecordGrade } from '@/lib/api'

export type FriendsSort = 'activity' | 'name'

export interface ProportionSegment {
  grade: RecordGrade
  count: number
  share: number
}

export function countsOf(member: FriendsMemberEntity): FriendsCounts {
  return member.counts as FriendsCounts
}

export function filterMembers(
  members: FriendsMemberEntity[],
  query: string,
): FriendsMemberEntity[] {
  const needle = query.trim().toLowerCase()
  if (!needle) return members
  return members.filter((member) => member.login.toLowerCase().includes(needle))
}

export function sortMembers(
  members: FriendsMemberEntity[],
  sort: FriendsSort,
): FriendsMemberEntity[] {
  return [...members].sort((a, b) => {
    const byLogin = a.login.localeCompare(b.login, 'ru')
    return sort === 'name' ? byLogin : b.total - a.total || byLogin
  })
}

/** Место по активности: userId → 1, 2, 3… независимо от фильтра и сортировки на экране. */
export function activityRanks(members: FriendsMemberEntity[]): Map<string, number> {
  return new Map(
    sortMembers(members, 'activity').map((member, index) => [member.userId, index + 1]),
  )
}

export function proportionSegments(counts: FriendsCounts): ProportionSegment[] {
  const total = FRIENDS_GRADE_ORDER.reduce((sum, grade) => sum + counts[grade], 0)
  if (total === 0) return []
  return FRIENDS_GRADE_ORDER.filter((grade) => counts[grade] > 0).map((grade) => ({
    grade,
    count: counts[grade],
    share: counts[grade] / total,
  }))
}
