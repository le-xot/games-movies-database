import { describe, expect, it } from 'bun:test'
import { isInitialStateLoad } from './use-wordle'

/**
 * `isLoading` у colada истинно и на рефетче с уже загруженными данными.
 * Если вешать скелетон на него, доска исчезает при каждом возврате на
 * страницу и ввод блокируется — нажатия теряются.
 */
describe('isInitialStateLoad', () => {
  it('shows the skeleton on the very first load', () => {
    expect(isInitialStateLoad(true, undefined)).toBe(true)
  })

  it('keeps the board visible while refetching cached data', () => {
    expect(isInitialStateLoad(true, { status: 'IN_PROGRESS' })).toBe(false)
  })

  it('keeps the board visible when a nullable state came back as null', () => {
    expect(isInitialStateLoad(true, null)).toBe(false)
  })

  it('hides the skeleton once loading finished', () => {
    expect(isInitialStateLoad(false, undefined)).toBe(false)
  })
})
