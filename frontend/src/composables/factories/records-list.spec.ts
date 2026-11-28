import { describe, expect, it } from 'bun:test'
import { nextPageParam } from '@/composables/factories/records-list'

describe('nextPageParam', () => {
  it('возвращает следующую страницу, пока загружено меньше total', () => {
    expect(nextPageParam(24, 50, 1)).toBe(2)
  })

  it('возвращает undefined, когда всё загружено', () => {
    expect(nextPageParam(50, 50, 1)).toBeUndefined()
  })

  it('считает по всем страницам, а не только по последней', () => {
    expect(nextPageParam(48, 50, 2)).toBe(3)
    expect(nextPageParam(50, 50, 3)).toBeUndefined()
  })

  it('возвращает undefined для пустого результата', () => {
    expect(nextPageParam(0, 0, 1)).toBeUndefined()
  })
})
