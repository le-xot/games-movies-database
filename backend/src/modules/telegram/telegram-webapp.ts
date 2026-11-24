import { createHmac, timingSafeEqual } from 'node:crypto'
import type { TelegramProfile } from '@backend/modules/telegram/telegram.types'

/**
 * Свежесть `initData`.
 *
 * Mini App генерирует данные при каждом открытии, сутки — запас на «свернул
 * Telegram на день и вернулся в то же окно». Просроченная строка не даёт
 * войти бессрочно, но и не ломает нормальный сценарий.
 */
export const TELEGRAM_WEBAPP_MAX_AGE_SECONDS = 24 * 60 * 60

/** Допуск на рассинхрон часов: клиент может считать время чуть вперёд. */
export const TELEGRAM_WEBAPP_CLOCK_SKEW_SECONDS = 5 * 60

/** Поле, в котором Telegram передаёт подписанные данные в хэше адреса. */
export const TELEGRAM_WEBAPP_HASH_FIELD = 'tgWebAppData'

const HMAC_KEY = 'WebAppData'

/**
 * Пользователь из `user`-поля `initData`.
 *
 * Поля необязательные: Telegram заполняет их по мере того, что человек указал
 * в профиле. `id` есть всегда — по нему и находится аккаунт.
 */
export interface TelegramWebAppUser {
  id: number
  first_name?: string | undefined
  last_name?: string | undefined
  username?: string | undefined
  photo_url?: string | undefined
}

export interface VerifyTelegramWebAppOptions {
  now?: Date
  maxAgeSeconds?: number
}

function safeEqualHex(left: string, right: string): boolean {
  if (left.length !== right.length) return false
  return timingSafeEqual(Buffer.from(left, 'utf8'), Buffer.from(right, 'utf8'))
}

/**
 * Проверяет подпись и свежесть `initData` Telegram Mini App.
 *
 * Алгоритм из документации Bot API: ключ — `HMAC-SHA256("WebAppData", botToken)`,
 * сообщение — все поля, кроме `hash`, отсортированные по имени и склеенные
 * через перевод строки. Сравнение — в постоянном времени.
 *
 * Возвращает `null` на любую проблему (нет подписи, чужая подпись, просрочка,
 * битый `user`): роут превращает это в 401 и не показывает причину наружу.
 */
export function verifyTelegramWebAppInitData(
  initData: string,
  botToken: string,
  options: VerifyTelegramWebAppOptions = {},
): TelegramWebAppUser | null {
  if (initData.length === 0 || botToken.length === 0) return null

  const params = new URLSearchParams(initData)
  const hash = params.get('hash')
  if (!hash) return null

  params.delete('hash')

  const dataCheckString = [...params.entries()]
    .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n')

  const secretKey = createHmac('sha256', HMAC_KEY).update(botToken).digest()
  const expected = createHmac('sha256', secretKey).update(dataCheckString).digest('hex')

  if (!safeEqualHex(hash, expected)) return null

  const authDate = Number(params.get('auth_date'))
  if (!Number.isFinite(authDate) || authDate <= 0) return null

  const nowSeconds = Math.floor((options.now ?? new Date()).getTime() / 1000)
  const maxAgeSeconds = options.maxAgeSeconds ?? TELEGRAM_WEBAPP_MAX_AGE_SECONDS

  if (authDate > nowSeconds + TELEGRAM_WEBAPP_CLOCK_SKEW_SECONDS) return null
  if (nowSeconds - authDate > maxAgeSeconds) return null

  return parseWebAppUser(params.get('user'))
}

function parseWebAppUser(raw: string | null): TelegramWebAppUser | null {
  if (!raw) return null

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }

  if (typeof parsed !== 'object' || parsed === null) return null

  const candidate = parsed as Record<string, unknown>
  const id = candidate['id']
  if (typeof id !== 'number' || !Number.isInteger(id) || id <= 0) return null

  return {
    id,
    ...(typeof candidate['first_name'] === 'string' ? { first_name: candidate['first_name'] } : {}),
    ...(typeof candidate['last_name'] === 'string' ? { last_name: candidate['last_name'] } : {}),
    ...(typeof candidate['username'] === 'string' ? { username: candidate['username'] } : {}),
    ...(typeof candidate['photo_url'] === 'string' ? { photo_url: candidate['photo_url'] } : {}),
  }
}

/** Переводит пользователя Mini App в общий профиль телеграм-входа. */
export function toTelegramProfile(user: TelegramWebAppUser): TelegramProfile {
  return {
    id: String(user.id),
    username: user.username,
    firstName: user.first_name ?? '',
    lastName: user.last_name,
    photoUrl: user.photo_url,
  }
}
