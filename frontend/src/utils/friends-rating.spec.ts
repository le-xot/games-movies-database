import { describe, expect, it } from 'bun:test'
import { RecordGrade } from '@/lib/api'
import { friendsTotal, emptyFriendsCounts, getTopGrade } from './friends-rating'

describe('getTopGrade', () => {
  it('returns null when nobody voted', () => {
    expect(getTopGrade(emptyFriendsCounts())).toBeNull()
  })

  it('returns the single most voted grade', () => {
    expect(
      getTopGrade({ ...emptyFriendsCounts(), [RecordGrade.BEER]: 3, [RecordGrade.LIKE]: 1 }),
    ).toBe(RecordGrade.BEER)
  })

  it('resolves ties towards RECOMMEND > LIKE > BEER > DISLIKE', () => {
    const tied = {
      [RecordGrade.DISLIKE]: 2,
      [RecordGrade.BEER]: 2,
      [RecordGrade.LIKE]: 2,
      [RecordGrade.RECOMMEND]: 2,
    }
    expect(getTopGrade(tied)).toBe(RecordGrade.RECOMMEND)
    expect(
      getTopGrade({ ...emptyFriendsCounts(), [RecordGrade.BEER]: 5, [RecordGrade.DISLIKE]: 5 }),
    ).toBe(RecordGrade.BEER)
  })
})

describe('friendsTotal', () => {
  it('sums all counters', () => {
    expect(
      friendsTotal({
        [RecordGrade.DISLIKE]: 1,
        [RecordGrade.BEER]: 2,
        [RecordGrade.LIKE]: 3,
        [RecordGrade.RECOMMEND]: 4,
      }),
    ).toBe(10)
  })

  it('is zero for empty counts', () => {
    expect(friendsTotal(emptyFriendsCounts())).toBe(0)
  })
})
