import { describe, expect, it } from 'bun:test'
import { AVATAR_FRAMES } from '@gmdb/contract'
import { resolveFrame } from '@/lib/user-customization'

describe('resolveFrame', () => {
  it('resolves every catalog frame to a ring with its requirement', () => {
    for (const frame of AVATAR_FRAMES) {
      const resolved = resolveFrame(frame.id)

      expect(resolved).not.toBeNull()
      expect(resolved?.id).toBe(frame.id)
      expect(resolved?.title).toBe(frame.title)
      expect(resolved?.requirement).toBe(frame.requirement)
      expect(resolved?.ringClassName).toContain('bg-')
    }
  })

  it('returns nothing without an id', () => {
    expect(resolveFrame(null)).toBeNull()
    expect(resolveFrame(undefined)).toBeNull()
    expect(resolveFrame('')).toBeNull()
  })

  it('returns nothing for an unknown or retired id', () => {
    expect(resolveFrame('diamond')).toBeNull()
    expect(resolveFrame('neon')).toBeNull()
  })
})
