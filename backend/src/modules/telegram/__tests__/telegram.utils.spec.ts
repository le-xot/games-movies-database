import { describe, expect, it } from 'bun:test'
import {
  buildTelegramAuthKeyboard,
  formatTelegramAuthPrompt,
  formatTelegramLogin,
  mapTelegramProfile,
  parseCallbackData,
  parseStartToken,
} from '../telegram.utils'

describe('parseStartToken', () => {
  it('extracts the token from /start <token>', () => {
    expect(parseStartToken('/start abc123')).toBe('abc123')
  })

  it('supports /start@botname <token>', () => {
    expect(parseStartToken('/start@gmd_bot abc123')).toBe('abc123')
  })

  it('returns null when /start has no token', () => {
    expect(parseStartToken('/start')).toBeNull()
    expect(parseStartToken('/start ')).toBeNull()
  })

  it('ignores arbitrary text and other commands', () => {
    expect(parseStartToken('hello')).toBeNull()
    expect(parseStartToken('/help abc')).toBeNull()
    expect(parseStartToken('')).toBeNull()
  })
})

describe('formatTelegramLogin', () => {
  it('prefers the username', () => {
    const login = formatTelegramLogin({
      id: '42',
      username: 'ivan',
      firstName: 'Ivan',
      lastName: 'Petrov',
    })
    expect(login).toBe('ivan')
  })

  it('falls back to first and last name', () => {
    expect(formatTelegramLogin({ id: '42', firstName: 'Ivan', lastName: 'Petrov' })).toBe(
      'Ivan Petrov',
    )
    expect(formatTelegramLogin({ id: '42', firstName: 'Ivan' })).toBe('Ivan')
  })

  it('falls back to tg_<id> when the name is empty', () => {
    expect(formatTelegramLogin({ id: '42', firstName: '' })).toBe('tg_42')
  })
})

describe('mapTelegramProfile', () => {
  it('maps the telegram user and optional photo', () => {
    const profile = mapTelegramProfile(
      { id: 42, first_name: 'Ivan', last_name: 'Petrov', username: 'ivan' },
      'https://api.telegram.org/file/bot123/photo.jpg',
    )

    expect(profile).toEqual({
      id: '42',
      username: 'ivan',
      firstName: 'Ivan',
      lastName: 'Petrov',
      photoUrl: 'https://api.telegram.org/file/bot123/photo.jpg',
    })
  })

  it('omits the photo when it is not available', () => {
    const profile = mapTelegramProfile({ id: 42, first_name: 'Ivan' }, null)

    expect(profile.photoUrl).toBeUndefined()
  })
})

describe('parseCallbackData', () => {
  it('parses confirm and cancel actions', () => {
    expect(parseCallbackData('confirm:token-1')).toEqual({ action: 'confirm', token: 'token-1' })
    expect(parseCallbackData('cancel:token-2')).toEqual({ action: 'cancel', token: 'token-2' })
  })

  it('returns null for unknown actions and empty tokens', () => {
    expect(parseCallbackData('confirm:')).toBeNull()
    expect(parseCallbackData('delete:token')).toBeNull()
    expect(parseCallbackData('confirm')).toBeNull()
    expect(parseCallbackData('')).toBeNull()
  })
})

describe('formatTelegramAuthPrompt', () => {
  it('shows the site host from the origin', () => {
    expect(formatTelegramAuthPrompt({ mode: 'login', origin: 'https://le-xot.dev' })).toBe(
      '🔐 Разрешить вход на сайте le-xot.dev?',
    )
    expect(formatTelegramAuthPrompt({ mode: 'link', origin: 'http://localhost:5173' })).toBe(
      '🔗 Привязать Telegram к аккаунту на сайте localhost:5173?',
    )
  })

  it('falls back to a generic prompt without a valid origin', () => {
    expect(formatTelegramAuthPrompt({ mode: 'login' })).toBe('🔐 Разрешить вход?')
    expect(formatTelegramAuthPrompt({ mode: 'login', origin: 'not a url' })).toBe(
      '🔐 Разрешить вход?',
    )
  })
})

describe('buildTelegramAuthKeyboard', () => {
  it('builds confirm and cancel buttons within the callback data limit', () => {
    const token = 'a'.repeat(43)

    const keyboard = buildTelegramAuthKeyboard(token)

    expect(keyboard.inline_keyboard).toHaveLength(2)
    expect(keyboard.inline_keyboard[0][0]).toEqual({
      text: '✅ Подтвердить',
      callback_data: `confirm:${token}`,
    })
    expect(keyboard.inline_keyboard[1][0]).toEqual({
      text: '❌ Отмена',
      callback_data: `cancel:${token}`,
    })
    expect(keyboard.inline_keyboard[0][0].callback_data.length).toBeLessThanOrEqual(64)
    expect(keyboard.inline_keyboard[1][0].callback_data.length).toBeLessThanOrEqual(64)
  })
})
