import { describe, expect, it } from 'bun:test'
import { isImageReady } from './image'

describe('isImageReady', () => {
  it('returns false without an image element', () => {
    expect(isImageReady(null)).toBe(false)
    expect(isImageReady(undefined)).toBe(false)
  })

  it('returns false while the browser still fetches the picture', () => {
    expect(isImageReady({ complete: false, naturalWidth: 0 })).toBe(false)
  })

  it('returns false for a broken picture', () => {
    expect(isImageReady({ complete: true, naturalWidth: 0 })).toBe(false)
  })

  it('returns true when the browser already has the picture', () => {
    expect(isImageReady({ complete: true, naturalWidth: 300 })).toBe(true)
  })
})
