import { describe, expect, it } from 'bun:test'
import { RecordGrade } from '@/lib/api'
import { activityRanks, filterMembers, proportionSegments, sortMembers } from './friends-members'
import type { FriendsMemberEntity } from '@/lib/api'

const member = (
  login: string,
  counts: Partial<Record<RecordGrade, number>> = {},
): FriendsMemberEntity => {
  const full = { DISLIKE: 0, BEER: 0, LIKE: 0, RECOMMEND: 0, ...counts }
  return {
    userId: login,
    login,
    profileImageUrl: '',
    counts: full,
    total: Object.values(full).reduce((sum, count) => sum + count, 0),
  }
}

describe('filterMembers', () => {
  const members = [member('Alice'), member('bob'), member('Malo')]

  it('matches logins case-insensitively and ignores surrounding spaces', () => {
    expect(filterMembers(members, '  AL ').map((item) => item.login)).toEqual(['Alice', 'Malo'])
  })

  it('returns everybody for an empty query', () => {
    expect(filterMembers(members, '   ')).toEqual(members)
  })
})

describe('sortMembers', () => {
  const members = [
    member('zed', { LIKE: 2 }),
    member('amy', { LIKE: 5 }),
    member('bob', { LIKE: 5 }),
  ]

  it('sorts by activity, then by login', () => {
    expect(sortMembers(members, 'activity').map((item) => item.login)).toEqual([
      'amy',
      'bob',
      'zed',
    ])
  })

  it('sorts by login ignoring activity', () => {
    const byName = [member('zed', { LIKE: 9 }), member('amy', { LIKE: 1 })]
    expect(sortMembers(byName, 'name').map((item) => item.login)).toEqual(['amy', 'zed'])
  })

  it('does not mutate the input array', () => {
    const input = [...members]
    sortMembers(input, 'name')
    expect(input.map((item) => item.login)).toEqual(['zed', 'amy', 'bob'])
  })
})

describe('activityRanks', () => {
  it('numbers members by activity starting from 1', () => {
    const ranks = activityRanks([member('zed', { LIKE: 2 }), member('amy', { LIKE: 5 })])
    expect(ranks.get('amy')).toBe(1)
    expect(ranks.get('zed')).toBe(2)
  })
})

describe('proportionSegments', () => {
  it('returns only grades with votes, in display order, with shares of the total', () => {
    expect(proportionSegments({ DISLIKE: 0, BEER: 1, LIKE: 0, RECOMMEND: 3 })).toEqual([
      { grade: RecordGrade.RECOMMEND, count: 3, share: 0.75 },
      { grade: RecordGrade.BEER, count: 1, share: 0.25 },
    ])
  })

  it('returns nothing when there are no votes', () => {
    expect(proportionSegments({ DISLIKE: 0, BEER: 0, LIKE: 0, RECOMMEND: 0 })).toEqual([])
  })
})
