import { describe, expect, it } from 'bun:test'
import { APP_TITLE_SUFFIX, formatTitle } from '@/stores/use-title'

describe('formatTitle', () => {
  it('добавляет суффикс по умолчанию', () => {
    expect(formatTitle('Игры')).toBe(`Игры ${APP_TITLE_SUFFIX}`)
  })

  it('не добавляет суффикс, если заголовок уже полный', () => {
    expect(formatTitle('Лешот — сайт Лешота', { suffix: false })).toBe('Лешот — сайт Лешота')
  })

  it('добавляет суффикс при suffix: true', () => {
    expect(formatTitle('Советы', { suffix: true })).toBe(`Советы ${APP_TITLE_SUFFIX}`)
  })
})
