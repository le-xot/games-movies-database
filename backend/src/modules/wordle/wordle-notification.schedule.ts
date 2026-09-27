const MSK_OFFSET_MS = 3 * 60 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000
const MINUTE_MS = 60 * 1000
const EVENING_CATCH_UP_CUTOFF_MINUTES = 23 * 60 + 30

export type SlotName = 'morning' | 'evening'

export interface SlotTime {
  hours: number
  minutes: number
}

export interface Slots {
  morning: SlotTime
  evening: SlotTime
}

export const DEFAULT_SLOTS: Slots = {
  morning: { hours: 12, minutes: 0 },
  evening: { hours: 20, minutes: 0 },
}

export function parseSlotTime(raw: string | null): SlotTime | null {
  if (!raw) return null
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(raw.trim())
  if (!match) return null
  return { hours: Number(match[1]), minutes: Number(match[2]) }
}

export function resolveSlots(
  morningRaw: string | null,
  eveningRaw: string | null,
  onInvalid?: (message: string) => void,
): Slots {
  const morning = parseSlotTime(morningRaw)
  const evening = parseSlotTime(eveningRaw)
  if (!morning || !evening) {
    onInvalid?.('Некорректное время слотов WORDLE_NOTIFY_* — использую дефолты 12:00/20:00')
    return { ...DEFAULT_SLOTS }
  }
  if (morning.hours * 60 + morning.minutes >= evening.hours * 60 + evening.minutes) {
    onInvalid?.('Утренний слот должен быть раньше вечернего — использую дефолты 12:00/20:00')
    return { ...DEFAULT_SLOTS }
  }
  return { morning, evening }
}

export function formatSlotTime(slot: SlotTime): string {
  return `${String(slot.hours).padStart(2, '0')}:${String(slot.minutes).padStart(2, '0')}`
}

function moscowMinutesOfDay(now: Date): number {
  return Math.floor(((now.getTime() + MSK_OFFSET_MS) % DAY_MS) / MINUTE_MS)
}

function msUntilMoscowTime(now: Date, slot: SlotTime): number {
  const shifted = now.getTime() + MSK_OFFSET_MS
  const dayStart = Math.floor(shifted / DAY_MS) * DAY_MS
  let target = dayStart + (slot.hours * 60 + slot.minutes) * MINUTE_MS
  if (target <= shifted) target += DAY_MS
  return target - shifted
}

export function nextSlotAt(now: Date, slots: Slots): { slot: SlotName; at: Date } {
  const morningDelay = msUntilMoscowTime(now, slots.morning)
  const eveningDelay = msUntilMoscowTime(now, slots.evening)
  const slot: SlotName = morningDelay <= eveningDelay ? 'morning' : 'evening'
  const delay = slot === 'morning' ? morningDelay : eveningDelay
  return { slot, at: new Date(now.getTime() + delay) }
}

export function pickCatchUpSlot(now: Date, slots: Slots): SlotName | null {
  const minutes = moscowMinutesOfDay(now)
  const morning = slots.morning.hours * 60 + slots.morning.minutes
  const evening = slots.evening.hours * 60 + slots.evening.minutes
  if (minutes >= evening && minutes < EVENING_CATCH_UP_CUTOFF_MINUTES) return 'evening'
  if (minutes >= morning && minutes < evening) return 'morning'
  return null
}
