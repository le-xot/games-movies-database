import { timingSafeEqual } from 'node:crypto'

/**
 * Сравнение секретов в постоянном времени: `===` утекает длиной совпавшего
 * префикса. Одна реализация для API-ключа `/twir` и секрета вебхука Telegram;
 * обе точки — единственная защита внешнего входа.
 */
export function secretsMatch(provided: unknown, expected: string | null | undefined): boolean {
  if (!expected || typeof provided !== 'string' || provided.length !== expected.length) {
    return false
  }

  return timingSafeEqual(Buffer.from(provided), Buffer.from(expected))
}
