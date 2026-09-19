import { describe, expect, it } from 'bun:test'
import {
  daysBetween,
  getMoscowDateKey,
  msUntilNextMoscowMidnight,
} from '@/modules/wordle/wordle.date'

describe('getMoscowDateKey', () => {
  it('returns the same day just before Moscow midnight', () => {
    expect(getMoscowDateKey(new Date('2026-09-20T20:59:59.999Z'))).toBe('2026-09-20')
  })

  it('returns the next day at exactly Moscow midnight', () => {
    expect(getMoscowDateKey(new Date('2026-09-20T21:00:00.000Z'))).toBe('2026-09-21')
  })

  it('returns the Moscow day during UTC morning', () => {
    expect(getMoscowDateKey(new Date('2026-09-20T08:00:00.000Z'))).toBe('2026-09-20')
  })
})

describe('msUntilNextMoscowMidnight', () => {
  it('returns one second one second before Moscow midnight', () => {
    expect(msUntilNextMoscowMidnight(new Date('2026-09-20T20:59:59.000Z'))).toBe(1000)
  })

  it('returns a full day at exactly Moscow midnight', () => {
    expect(msUntilNextMoscowMidnight(new Date('2026-09-20T21:00:00.000Z'))).toBe(86_400_000)
  })

  it('returns the remaining part of the day at noon Moscow time', () => {
    expect(msUntilNextMoscowMidnight(new Date('2026-09-20T09:00:00.000Z'))).toBe(43_200_000)
  })
})

describe('daysBetween', () => {
  it('returns 1 for consecutive days', () => {
    expect(daysBetween('2026-09-19', '2026-09-20')).toBe(1)
  })

  it('returns 0 for the same day', () => {
    expect(daysBetween('2026-09-20', '2026-09-20')).toBe(0)
  })

  it('returns a negative value when the second date is earlier', () => {
    expect(daysBetween('2026-09-20', '2026-09-18')).toBe(-2)
  })
})
