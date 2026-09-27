import { describe, expect, it, mock } from 'bun:test'
import {
  DEFAULT_SLOTS,
  formatSlotTime,
  nextSlotAt,
  parseSlotTime,
  pickCatchUpSlot,
  resolveSlots,
} from '@/modules/wordle/wordle-notification.schedule'

describe('parseSlotTime', () => {
  it('parses valid times', () => {
    expect(parseSlotTime('09:05')).toEqual({ hours: 9, minutes: 5 })
    expect(parseSlotTime('23:59')).toEqual({ hours: 23, minutes: 59 })
  })

  it('rejects invalid values', () => {
    expect(parseSlotTime('24:00')).toBeNull()
    expect(parseSlotTime('9:5')).toBeNull()
    expect(parseSlotTime('12:60')).toBeNull()
    expect(parseSlotTime(null)).toBeNull()
  })
})

describe('resolveSlots', () => {
  it('keeps a valid ordered pair', () => {
    expect(resolveSlots('09:30', '21:15')).toEqual({
      morning: { hours: 9, minutes: 30 },
      evening: { hours: 21, minutes: 15 },
    })
  })

  it('falls back to both defaults on invalid values', () => {
    const warn = mock(() => {})
    expect(resolveSlots('нет', '20:00', warn)).toEqual(DEFAULT_SLOTS)
    expect(warn).toHaveBeenCalledTimes(1)
  })

  it('falls back when morning is not before evening', () => {
    const warn = mock(() => {})
    expect(resolveSlots('21:00', '10:00', warn)).toEqual(DEFAULT_SLOTS)
    expect(warn).toHaveBeenCalledTimes(1)
  })
})

describe('formatSlotTime', () => {
  it('pads to HH:MM', () => {
    expect(formatSlotTime({ hours: 9, minutes: 5 })).toBe('09:05')
    expect(formatSlotTime({ hours: 20, minutes: 0 })).toBe('20:00')
  })
})

describe('nextSlotAt', () => {
  it('picks the morning slot before noon MSK', () => {
    const now = new Date('2026-09-20T08:59:00.000Z') // 11:59 MSK
    expect(nextSlotAt(now, DEFAULT_SLOTS)).toEqual({
      slot: 'morning',
      at: new Date('2026-09-20T09:00:00.000Z'),
    })
  })

  it('picks the evening slot at noon MSK exactly', () => {
    const now = new Date('2026-09-20T09:00:00.000Z') // 12:00 MSK
    expect(nextSlotAt(now, DEFAULT_SLOTS)).toEqual({
      slot: 'evening',
      at: new Date('2026-09-20T17:00:00.000Z'),
    })
  })

  it('rolls over to tomorrow morning after the evening slot', () => {
    const now = new Date('2026-09-20T18:00:00.000Z') // 21:00 MSK
    expect(nextSlotAt(now, DEFAULT_SLOTS)).toEqual({
      slot: 'morning',
      at: new Date('2026-09-21T09:00:00.000Z'),
    })
  })
})

describe('pickCatchUpSlot', () => {
  it('returns null before the morning slot', () => {
    expect(pickCatchUpSlot(new Date('2026-09-20T08:59:00.000Z'), DEFAULT_SLOTS)).toBeNull()
  })

  it('returns morning from 12:00 MSK until the evening slot', () => {
    expect(pickCatchUpSlot(new Date('2026-09-20T09:00:00.000Z'), DEFAULT_SLOTS)).toBe('morning')
    expect(pickCatchUpSlot(new Date('2026-09-20T16:59:00.000Z'), DEFAULT_SLOTS)).toBe('morning')
  })

  it('returns evening from 20:00 to 23:29 MSK', () => {
    expect(pickCatchUpSlot(new Date('2026-09-20T17:00:00.000Z'), DEFAULT_SLOTS)).toBe('evening')
    expect(pickCatchUpSlot(new Date('2026-09-20T20:29:00.000Z'), DEFAULT_SLOTS)).toBe('evening')
  })

  it('returns null from 23:30 MSK until midnight', () => {
    expect(pickCatchUpSlot(new Date('2026-09-20T20:30:00.000Z'), DEFAULT_SLOTS)).toBeNull()
  })
})
