import { describe, expect, it } from 'bun:test'
import {
  parseGuestBar,
  serializeGuestBar,
  withToggled,
} from '@/pages/cocktails/composables/use-cocktail-bar'

describe('parseGuestBar', () => {
  it('drops duplicates and empty entries', () => {
    expect(parseGuestBar('a,b,a')).toEqual(['a', 'b'])
  })

  it('treats missing storage as an empty bar', () => {
    expect(parseGuestBar(null)).toEqual([])
    expect(parseGuestBar('')).toEqual([])
  })

  it('ignores surrounding spaces', () => {
    expect(parseGuestBar(' gin , lime ')).toEqual(['gin', 'lime'])
  })
})

describe('serializeGuestBar', () => {
  it('joins ids with a comma', () => {
    expect(serializeGuestBar(['b', 'a'])).toBe('b,a')
  })

  it('round-trips through parsing', () => {
    expect(parseGuestBar(serializeGuestBar(['gin', 'lime']))).toEqual(['gin', 'lime'])
  })
})

describe('withToggled', () => {
  it('appends a missing id', () => {
    expect(withToggled(['a'], 'b')).toEqual(['a', 'b'])
  })

  it('removes an existing id', () => {
    expect(withToggled(['a', 'b'], 'a')).toEqual(['b'])
  })

  it('does not mutate the input', () => {
    const input = ['a']
    withToggled(input, 'b')
    expect(input).toEqual(['a'])
  })
})
