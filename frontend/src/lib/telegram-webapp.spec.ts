import { describe, expect, it } from 'bun:test'
import {
  TELEGRAM_MINI_APP_PATH,
  isTelegramMiniAppPath,
  readInitDataFromHash,
} from '@/lib/telegram-webapp'

describe('isTelegramMiniAppPath', () => {
  it('matches only the Mini App route', () => {
    expect(isTelegramMiniAppPath(TELEGRAM_MINI_APP_PATH)).toBe(true)
    expect(isTelegramMiniAppPath(`${TELEGRAM_MINI_APP_PATH}/`)).toBe(true)
    expect(isTelegramMiniAppPath('/db/wordle')).toBe(false)
    expect(isTelegramMiniAppPath('/tg')).toBe(false)
    expect(isTelegramMiniAppPath('/')).toBe(false)
  })
})

describe('readInitDataFromHash', () => {
  it('extracts and decodes tgWebAppData', () => {
    const hash = '#tgWebAppData=query_id%3D1%26hash%3Dabc&tgWebAppVersion=7.0'

    expect(readInitDataFromHash(hash)).toBe('query_id=1&hash=abc')
  })

  it('accepts the hash without the leading #', () => {
    expect(readInitDataFromHash('tgWebAppData=auth_date%3D1')).toBe('auth_date=1')
  })

  it('returns null when the field is missing or empty', () => {
    expect(readInitDataFromHash('')).toBeNull()
    expect(readInitDataFromHash('#tgWebAppVersion=7.0')).toBeNull()
    expect(readInitDataFromHash('#tgWebAppData=')).toBeNull()
  })
})
