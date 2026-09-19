const MOSCOW_OFFSET_MS = 3 * 60 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000

export function getMoscowDateKey(now: Date = new Date()): string {
  return new Date(now.getTime() + MOSCOW_OFFSET_MS).toISOString().slice(0, 10)
}

export function msUntilNextMoscowMidnight(now: Date = new Date()): number {
  const shifted = now.getTime() + MOSCOW_OFFSET_MS
  return DAY_MS - (shifted % DAY_MS)
}

export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS)
}
