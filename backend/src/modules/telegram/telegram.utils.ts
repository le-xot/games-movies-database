import type {
  TelegramAuthMode,
  TelegramInlineKeyboardMarkup,
  TelegramProfile,
  TelegramUser,
} from './telegram.types'

const START_COMMAND_PATTERN = /^\/start(?:@[A-Za-z0-9_]+)?(?:\s+(\S+))?$/
const CALLBACK_ACTIONS = ['confirm', 'cancel'] as const

export type TelegramCallbackAction = (typeof CALLBACK_ACTIONS)[number]

export function parseStartToken(text: string): string | null {
  const match = text.trim().match(START_COMMAND_PATTERN)
  return match?.[1] ?? null
}

export function formatTelegramLogin(profile: TelegramProfile): string {
  if (profile.username) return profile.username
  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(' ')
  return fullName || `tg_${profile.id}`
}

export function mapTelegramProfile(user: TelegramUser, photoUrl: string | null): TelegramProfile {
  return {
    id: String(user.id),
    username: user.username,
    firstName: user.first_name,
    lastName: user.last_name,
    photoUrl: photoUrl ?? undefined,
  }
}

export function parseCallbackData(
  data: string,
): { action: TelegramCallbackAction; token: string } | null {
  const value = data.trim()
  for (const action of CALLBACK_ACTIONS) {
    const prefix = `${action}:`
    if (value.startsWith(prefix) && value.length > prefix.length) {
      return { action, token: value.slice(prefix.length) }
    }
  }
  return null
}

export function formatTelegramAuthPrompt(record: {
  mode: TelegramAuthMode
  origin?: string
}): string {
  const site = formatOriginHost(record.origin)
  if (record.mode === 'link') {
    return site
      ? `🔗 Привязать Telegram к аккаунту на сайте ${site}?`
      : '🔗 Привязать Telegram к аккаунту?'
  }
  return site ? `🔐 Разрешить вход на сайте ${site}?` : '🔐 Разрешить вход?'
}

export function buildTelegramAuthKeyboard(token: string): TelegramInlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [{ text: '✅ Подтвердить', callback_data: `confirm:${token}` }],
      [{ text: '❌ Отмена', callback_data: `cancel:${token}` }],
    ],
  }
}

function formatOriginHost(origin?: string): string | null {
  if (!origin) return null
  try {
    return new URL(origin).host
  } catch {
    return null
  }
}
