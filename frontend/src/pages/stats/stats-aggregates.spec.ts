import { describe, expect, it } from 'bun:test'
import { RecordGenre, RecordGrade } from '@/lib/api'
import { buildBreakdownRows, sumCounts, sumCountsByGenre } from './stats-aggregates'

describe('sumCountsByGenre', () => {
  it('sums counts per genre in display order', () => {
    expect(
      sumCountsByGenre([
        { genre: RecordGenre.MOVIE, count: 2 },
        { genre: RecordGenre.GAME, count: 1 },
        { genre: RecordGenre.MOVIE, count: 3 },
      ]),
    ).toEqual([
      { genre: RecordGenre.GAME, count: 1 },
      { genre: RecordGenre.MOVIE, count: 5 },
    ])
  })

  it('drops genres without votes', () => {
    expect(sumCountsByGenre([{ genre: RecordGenre.ANIME, count: 0 }])).toEqual([])
  })
})

describe('sumCounts', () => {
  it('adds up all counts', () => {
    expect(sumCounts([{ count: 2 }, { count: 5 }])).toBe(7)
    expect(sumCounts([])).toBe(0)
  })
})

describe('buildBreakdownRows', () => {
  const categories = [
    { key: RecordGrade.LIKE, label: 'Понравилось', color: '#2b593f' },
    { key: RecordGrade.DISLIKE, label: 'Не рекомендую', color: '#6e3630' },
  ]

  it('keeps only genres with data, in display order, aligned with categories', () => {
    const rows = buildBreakdownRows(
      [
        { genre: RecordGenre.MOVIE, key: RecordGrade.DISLIKE, count: 1 },
        { genre: RecordGenre.GAME, key: RecordGrade.LIKE, count: 2 },
        { genre: RecordGenre.MOVIE, key: RecordGrade.LIKE, count: 4 },
      ],
      categories,
    )

    expect(rows.map((row) => [row.genre, row.index, row.label, row.counts])).toEqual([
      [RecordGenre.GAME, 0, 'Игры', [2, 0]],
      [RecordGenre.MOVIE, 1, 'Фильмы', [4, 1]],
    ])
  })

  it('returns no rows when nothing has data', () => {
    expect(buildBreakdownRows([], categories)).toEqual([])
  })
})
