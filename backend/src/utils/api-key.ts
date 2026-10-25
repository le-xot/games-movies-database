import { timingSafeEqual } from 'node:crypto'

/**
 * Сравнение API-ключа в постоянном времени: обычное `===` утекает длиной
 * префикса, а ключ здесь — единственная защита внешнего входа (/twir).
 */
export function isApiKeyValid(provided: unknown, expected: string | null | undefined): boolean {
  if (!expected || typeof provided !== 'string' || provided.length !== expected.length) {
    return false
  }

  return timingSafeEqual(Buffer.from(provided), Buffer.from(expected))
}
