import { describe, expect, it } from 'bun:test'
import { isPaletteShortcut } from './use-command-palette-hotkey'

const base = { ctrlKey: false, metaKey: false }

describe('isPaletteShortcut', () => {
  it('matches the physical K key on a Cyrillic layout', () => {
    expect(isPaletteShortcut({ ...base, key: 'к', code: 'KeyK', ctrlKey: true })).toBe(true)
  })

  it('matches Cmd+K on a latin layout', () => {
    expect(isPaletteShortcut({ ...base, key: 'k', code: 'KeyK', metaKey: true })).toBe(true)
  })

  it('matches an uppercase K', () => {
    expect(isPaletteShortcut({ ...base, key: 'K', code: 'KeyK', ctrlKey: true })).toBe(true)
  })

  it('matches the k character when it sits on another physical key', () => {
    expect(isPaletteShortcut({ ...base, key: 'k', code: 'KeyN', ctrlKey: true })).toBe(true)
  })

  it('ignores the shortcut without a modifier', () => {
    expect(isPaletteShortcut({ ...base, key: 'k', code: 'KeyK' })).toBe(false)
  })

  it('ignores other keys', () => {
    expect(isPaletteShortcut({ ...base, key: 'и', code: 'KeyB', ctrlKey: true })).toBe(false)
  })
})
