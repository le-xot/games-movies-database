import { describe, expect, it } from 'bun:test'
import { BadRequestException } from '@nestjs/common'
import { assertPixelLimit, MAX_IMAGE_PIXELS } from '../image-limits'

describe('assertPixelLimit', () => {
  it('accepts an image exactly at the limit', () => {
    expect(() => assertPixelLimit(5000, 5000)).not.toThrow()
  })

  it('accepts small dimensions', () => {
    expect(() => assertPixelLimit(1, 1)).not.toThrow()
  })

  it.each([
    [100_000, 100_000],
    [5000, 5001],
  ])('rejects %sx%s above the limit', (width, height) => {
    expect(() => assertPixelLimit(width, height)).toThrow(BadRequestException)
  })

  it.each([
    [0, 100],
    [100, 0],
    [-1, 100],
    [Number.NaN, 100],
    [Number.POSITIVE_INFINITY, 1],
  ])('rejects invalid dimensions %sx%s', (width, height) => {
    expect(() => assertPixelLimit(width, height)).toThrow(BadRequestException)
  })

  it('exposes a 25MP default', () => {
    expect(MAX_IMAGE_PIXELS).toBe(25_000_000)
  })
})
