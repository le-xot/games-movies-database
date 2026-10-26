import { describe, expect, it } from 'bun:test'
import { AVATAR_FRAMES, USER_BADGES } from '@gmdb/contract'
import { BADGE_OPTIONS, FRAME_OPTIONS, resolveBadge, resolveFrame } from '@/lib/user-customization'

describe('resolveFrame', () => {
  it('resolves every catalog frame to a ring', () => {
    for (const frame of AVATAR_FRAMES) {
      const resolved = resolveFrame(frame.id)

      expect(resolved).not.toBeNull()
      expect(resolved?.id).toBe(frame.id)
      expect(resolved?.title).toBe(frame.title)
      expect(resolved?.ringClassName).toContain('bg-')
    }
  })

  it('returns nothing without an id', () => {
    expect(resolveFrame(null)).toBeNull()
    expect(resolveFrame(undefined)).toBeNull()
    expect(resolveFrame('')).toBeNull()
  })

  it('returns nothing for an unknown id', () => {
    expect(resolveFrame('diamond')).toBeNull()
  })
})

describe('resolveBadge', () => {
  it('resolves every catalog badge to an icon', () => {
    for (const badge of USER_BADGES) {
      const resolved = resolveBadge(badge.id)

      expect(resolved?.id).toBe(badge.id)
      expect(resolved?.title).toBe(badge.title)
      expect(resolved?.icon).toBeTruthy()
    }
  })

  it('returns nothing for an unknown id', () => {
    expect(resolveBadge('vip')).toBeNull()
    expect(resolveBadge(null)).toBeNull()
  })
})

describe('options', () => {
  it('expose the catalog in order', () => {
    expect(FRAME_OPTIONS).toEqual(AVATAR_FRAMES.map((frame) => frame.id))
    expect(BADGE_OPTIONS).toEqual(USER_BADGES.map((badge) => badge.id))
  })
})
