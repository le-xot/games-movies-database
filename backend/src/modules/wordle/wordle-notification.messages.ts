export const PLAY_BUTTON_TEXT = 'Играть'

export function pluralizeDays(count: number): string {
  const mod100 = Math.abs(count) % 100
  const mod10 = Math.abs(count) % 10
  if (mod100 >= 11 && mod100 <= 14) return 'дней'
  if (mod10 === 1) return 'день'
  if (mod10 >= 2 && mod10 <= 4) return 'дня'
  return 'дней'
}

export function buildMorningText(streak: number): string {
  return `☀️ Новый день — новое слово. Уже ${streak} ${pluralizeDays(streak)} подряд в серии 🔥 — продолжай!`
}

export function buildEveningText(streak: number): string {
  return `⏳ Партия за сегодня ещё не завершена. Серия ${streak} 🔥 под угрозой — успей до полуночи.`
}

export function buildPlayUrl(appPublicUrl: string): string {
  return `${appPublicUrl.replace(/\/+$/, '')}/db/wordle`
}

export function buildConnectedText(morningTime: string, eveningTime: string): string {
  return `🔔 Готово! Буду напоминать в ${morningTime} и ${eveningTime} (МСК). Настроить — в аккаунте, отключить — /stop.`
}
