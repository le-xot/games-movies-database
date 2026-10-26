import { describe, expect, it } from 'bun:test'
import { UserRole } from '@backend/enums'
import {
  earnedAvatarFrames,
  mergeUnlockedFrames,
} from '@backend/modules/user/customization.achievements'
import { AVATAR_FRAME_RULES } from '@gmdb/contract'

const NO_STATS = { role: UserRole.USER, ratingsCount: 0, maxWordleStreak: 0 }

describe('earnedAvatarFrames', () => {
  it('gives nothing to a regular inactive user', () => {
    expect(earnedAvatarFrames(NO_STATS)).toEqual([])
  })

  it('gives the admin frame to an admin only', () => {
    expect(earnedAvatarFrames({ ...NO_STATS, role: UserRole.ADMIN })).toEqual(['admin'])
  })

  it('gives the streak frame from the threshold', () => {
    const below = AVATAR_FRAME_RULES.wordleStreak - 1
    const at = AVATAR_FRAME_RULES.wordleStreak

    expect(earnedAvatarFrames({ ...NO_STATS, maxWordleStreak: below })).toEqual([])
    expect(earnedAvatarFrames({ ...NO_STATS, maxWordleStreak: at })).toEqual(['wordle-streak'])
  })

  it('gives the ratings frame only strictly above the threshold', () => {
    const at = AVATAR_FRAME_RULES.ratings

    expect(earnedAvatarFrames({ ...NO_STATS, ratingsCount: at })).toEqual([])
    expect(earnedAvatarFrames({ ...NO_STATS, ratingsCount: at + 1 })).toEqual(['ratings-100'])
  })

  it('returns every earned frame in catalog order', () => {
    expect(
      earnedAvatarFrames({
        role: UserRole.ADMIN,
        ratingsCount: AVATAR_FRAME_RULES.ratings + 1,
        maxWordleStreak: AVATAR_FRAME_RULES.wordleStreak,
      }),
    ).toEqual(['admin', 'wordle-streak', 'ratings-100'])
  })
})

describe('mergeUnlockedFrames', () => {
  it('keeps already unlocked frames even after the condition is gone', () => {
    expect(mergeUnlockedFrames(['wordle-streak'], [])).toEqual(['wordle-streak'])
  })

  it('unions without duplicates', () => {
    expect(mergeUnlockedFrames(['admin'], ['admin', 'ratings-100'])).toEqual([
      'admin',
      'ratings-100',
    ])
  })

  it('drops ids that are no longer in the catalog', () => {
    expect(mergeUnlockedFrames(['neon', 'admin'], [])).toEqual(['admin'])
  })
})
