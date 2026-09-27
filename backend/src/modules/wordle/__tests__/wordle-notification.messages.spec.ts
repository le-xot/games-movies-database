import { describe, expect, it } from 'bun:test'
import {
  PLAY_BUTTON_TEXT,
  buildConnectedText,
  buildEveningText,
  buildMorningText,
  buildPlayUrl,
  pluralizeDays,
} from '@/modules/wordle/wordle-notification.messages'

describe('pluralizeDays', () => {
  it('declines days correctly', () => {
    expect(pluralizeDays(0)).toBe('дней')
    expect(pluralizeDays(1)).toBe('день')
    expect(pluralizeDays(2)).toBe('дня')
    expect(pluralizeDays(4)).toBe('дня')
    expect(pluralizeDays(5)).toBe('дней')
    expect(pluralizeDays(11)).toBe('дней')
    expect(pluralizeDays(14)).toBe('дней')
    expect(pluralizeDays(21)).toBe('день')
    expect(pluralizeDays(22)).toBe('дня')
    expect(pluralizeDays(25)).toBe('дней')
  })
})

describe('buildMorningText', () => {
  it('includes the streak and the correct day form', () => {
    expect(buildMorningText(1)).toBe(
      '☀️ Новый день — новое слово. Уже 1 день подряд в серии 🔥 — продолжай!',
    )
    expect(buildMorningText(7)).toBe(
      '☀️ Новый день — новое слово. Уже 7 дней подряд в серии 🔥 — продолжай!',
    )
  })
})

describe('buildEveningText', () => {
  it('includes the streak', () => {
    expect(buildEveningText(5)).toBe(
      '⏳ Партия за сегодня ещё не завершена. Серия 5 🔥 под угрозой — успей до полуночи.',
    )
  })
})

describe('buildPlayUrl', () => {
  it('joins the base url and the wordle path', () => {
    expect(buildPlayUrl('https://le-xot.dev')).toBe('https://le-xot.dev/db/wordle')
    expect(buildPlayUrl('https://le-xot.dev/')).toBe('https://le-xot.dev/db/wordle')
  })
})

describe('buildConnectedText', () => {
  it('mentions both configured times', () => {
    expect(buildConnectedText('12:00', '20:00')).toContain('12:00 и 20:00')
    expect(buildConnectedText('12:00', '20:00')).toContain('/stop')
  })
})

describe('PLAY_BUTTON_TEXT', () => {
  it('is the play label', () => {
    expect(PLAY_BUTTON_TEXT).toBe('Играть')
  })
})
