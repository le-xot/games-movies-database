import { describe, expect, it } from 'bun:test'
import { getNextRatingsPageParam } from './user-ratings-pagination'
import type { GetUserRatingsEntity } from '@/lib/api'

function page(itemCount: number, total: number): GetUserRatingsEntity {
  return {
    items: Array.from({ length: itemCount }, (_, index) => ({ id: index }) as never),
    total,
  }
}

describe('getNextRatingsPageParam', () => {
  it('возвращает следующую страницу, пока загружено меньше total', () => {
    const first = page(24, 50)
    expect(getNextRatingsPageParam(first, [first], 1)).toBe(2)
  })

  it('возвращает undefined, когда всё загружено', () => {
    const full = page(50, 50)
    expect(getNextRatingsPageParam(full, [full], 1)).toBeUndefined()
  })

  it('считает по всем страницам, а не только по последней', () => {
    const first = page(24, 50)
    const second = page(24, 50)
    expect(getNextRatingsPageParam(second, [first, second], 2)).toBe(3)

    const last = page(2, 50)
    expect(getNextRatingsPageParam(last, [first, second, last], 3)).toBeUndefined()
  })

  it('возвращает undefined для пустого результата', () => {
    const empty = page(0, 0)
    expect(getNextRatingsPageParam(empty, [empty], 1)).toBeUndefined()
  })
})
