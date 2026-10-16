/** Русская форма слова под число: pluralRu(5, ['оценка', 'оценки', 'оценок']) → 'оценок'. */
export function pluralRu(count: number, forms: readonly [string, string, string]): string {
  const n = Math.abs(Math.trunc(count))
  const last = n % 10
  const lastTwo = n % 100
  if (last === 1 && lastTwo !== 11) return forms[0]
  if (last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14)) return forms[1]
  return forms[2]
}
