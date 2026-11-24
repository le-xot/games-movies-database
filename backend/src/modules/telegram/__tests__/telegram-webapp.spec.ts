import { describe, expect, it } from 'bun:test'
import { createHmac } from 'node:crypto'
import {
  TELEGRAM_WEBAPP_MAX_AGE_SECONDS,
  toTelegramProfile,
  verifyTelegramWebAppInitData,
} from '@backend/modules/telegram/telegram-webapp'

const BOT_TOKEN = '123456:test-token'
const NOW = new Date('2026-03-01T12:00:00.000Z')
const NOW_SECONDS = Math.floor(NOW.getTime() / 1000)

const USER = {
  id: 42,
  first_name: 'Иван',
  last_name: 'Петров',
  username: 'ivan',
  photo_url: 'https://t.me/i/userpic/320/ivan.jpg',
}

/** Собирает подписанный initData так же, как это делает Telegram. */
function signInitData(fields: Record<string, string>, botToken = BOT_TOKEN): string {
  const dataCheckString = Object.entries(fields)
    .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n')
  const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest()
  const hash = createHmac('sha256', secretKey).update(dataCheckString).digest('hex')

  return new URLSearchParams({ ...fields, hash }).toString()
}

function validInitData(overrides: Record<string, string> = {}): string {
  return signInitData({
    query_id: 'AAHdF6IQAAAAAN0XohDhrOrc',
    user: JSON.stringify(USER),
    auth_date: String(NOW_SECONDS),
    ...overrides,
  })
}

describe('verifyTelegramWebAppInitData', () => {
  it('accepts a signature made by Telegram', () => {
    const user = verifyTelegramWebAppInitData(validInitData(), BOT_TOKEN, { now: NOW })

    expect(user).toEqual(USER)
  })

  it('rejects a signature made with another bot token', () => {
    const initData = signInitData(
      { user: JSON.stringify(USER), auth_date: String(NOW_SECONDS) },
      '999:other-token',
    )

    expect(verifyTelegramWebAppInitData(initData, BOT_TOKEN, { now: NOW })).toBeNull()
  })

  it('rejects data edited after signing', () => {
    const params = new URLSearchParams(validInitData())
    params.set('user', JSON.stringify({ ...USER, id: 43 }))

    expect(verifyTelegramWebAppInitData(params.toString(), BOT_TOKEN, { now: NOW })).toBeNull()
  })

  it('rejects stale data', () => {
    const initData = validInitData({
      auth_date: String(NOW_SECONDS - TELEGRAM_WEBAPP_MAX_AGE_SECONDS - 1),
    })

    expect(verifyTelegramWebAppInitData(initData, BOT_TOKEN, { now: NOW })).toBeNull()
  })

  it('accepts data right at the freshness edge', () => {
    const initData = validInitData({
      auth_date: String(NOW_SECONDS - TELEGRAM_WEBAPP_MAX_AGE_SECONDS),
    })

    expect(verifyTelegramWebAppInitData(initData, BOT_TOKEN, { now: NOW })).not.toBeNull()
  })

  it('rejects data from the far future', () => {
    const initData = validInitData({ auth_date: String(NOW_SECONDS + 3600) })

    expect(verifyTelegramWebAppInitData(initData, BOT_TOKEN, { now: NOW })).toBeNull()
  })

  it('honours a custom max age', () => {
    const initData = validInitData({ auth_date: String(NOW_SECONDS - 120) })

    expect(
      verifyTelegramWebAppInitData(initData, BOT_TOKEN, { now: NOW, maxAgeSeconds: 60 }),
    ).toBeNull()
  })

  it('rejects data without a hash', () => {
    const initData = new URLSearchParams({
      user: JSON.stringify(USER),
      auth_date: String(NOW_SECONDS),
    }).toString()

    expect(verifyTelegramWebAppInitData(initData, BOT_TOKEN, { now: NOW })).toBeNull()
  })

  it('rejects empty input and empty bot token', () => {
    expect(verifyTelegramWebAppInitData('', BOT_TOKEN, { now: NOW })).toBeNull()
    expect(verifyTelegramWebAppInitData(validInitData(), '', { now: NOW })).toBeNull()
  })

  it('rejects a broken user payload even with a valid signature', () => {
    const initData = validInitData({ user: '{не json' })

    expect(verifyTelegramWebAppInitData(initData, BOT_TOKEN, { now: NOW })).toBeNull()
  })

  it('rejects a user without id', () => {
    const initData = validInitData({ user: JSON.stringify({ first_name: 'Иван' }) })

    expect(verifyTelegramWebAppInitData(initData, BOT_TOKEN, { now: NOW })).toBeNull()
  })

  it('rejects data without auth_date', () => {
    const initData = signInitData({ user: JSON.stringify(USER) })

    expect(verifyTelegramWebAppInitData(initData, BOT_TOKEN, { now: NOW })).toBeNull()
  })
})

describe('toTelegramProfile', () => {
  it('maps the telegram user to the login profile', () => {
    expect(toTelegramProfile(USER)).toEqual({
      id: '42',
      username: 'ivan',
      firstName: 'Иван',
      lastName: 'Петров',
      photoUrl: 'https://t.me/i/userpic/320/ivan.jpg',
    })
  })

  it('keeps an empty first name when the profile has none', () => {
    expect(toTelegramProfile({ id: 7 })).toEqual({
      id: '7',
      username: undefined,
      firstName: '',
      lastName: undefined,
      photoUrl: undefined,
    })
  })
})
