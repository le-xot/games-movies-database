import { describe, expect, it } from 'bun:test'
import { RecordGenre, RecordType } from '@/lib/api'
import { groupSuggestions, isQueuedRecord } from '@/pages/suggestion/composables/suggestion-groups'

const item = (overrides: Partial<Record<string, unknown>>) =>
  ({
    id: 1,
    title: 'Item',
    genre: RecordGenre.GAME,
    type: RecordType.SUGGESTION,
    createdAt: '2026-01-01T00:00:00.000Z',
    likes: [],
    ...overrides,
  }) as never

describe('groupSuggestions', () => {
  it('ставит очередь первой и сортирует по дате', () => {
    const groups = groupSuggestions(
      [
        item({ id: 1, type: RecordType.WRITTEN, createdAt: '2026-01-01T00:00:00.000Z' }),
        item({ id: 2, type: RecordType.WRITTEN, createdAt: '2026-02-01T00:00:00.000Z' }),
        item({ id: 3, genre: RecordGenre.MOVIE }),
      ],
      'date',
    )

    expect(groups[0]?.key).toBe('queued')
    expect(groups[0]?.items.map((entry) => entry.id)).toEqual([2, 1])
  })

  it('раскладывает по жанрам в порядке реестра', () => {
    const groups = groupSuggestions(
      [
        item({ id: 1, genre: RecordGenre.SERIES }),
        item({ id: 2, genre: RecordGenre.MOVIE }),
        item({ id: 3, genre: RecordGenre.GAME }),
      ],
      'date',
    )

    expect(groups.map((group) => group.key)).toEqual([
      RecordGenre.MOVIE,
      RecordGenre.GAME,
      RecordGenre.SERIES,
    ])
  })

  it('сортирует по лайкам, когда выбрано «likes»', () => {
    const groups = groupSuggestions(
      [
        item({ id: 1, likes: [{ id: 1 }, { id: 2 }] }),
        item({ id: 2, likes: [{ id: 3 }] }),
        item({ id: 3, likes: [] }),
      ],
      'likes',
    )

    expect(groups[0]?.items.map((entry) => entry.id)).toEqual([1, 2, 3])
  })

  it('очередь сортируется по дате даже в режиме лайков', () => {
    const groups = groupSuggestions(
      [
        item({ id: 1, type: RecordType.WRITTEN, createdAt: '2026-01-01T00:00:00.000Z', likes: [] }),
        item({
          id: 2,
          type: RecordType.WRITTEN,
          createdAt: '2026-03-01T00:00:00.000Z',
          likes: [{ id: 1 }],
        }),
        item({
          id: 3,
          type: RecordType.WRITTEN,
          createdAt: '2026-02-01T00:00:00.000Z',
          likes: [{ id: 1 }, { id: 2 }, { id: 3 }],
        }),
      ],
      'likes',
    )

    expect(groups[0]?.key).toBe('queued')
    expect(groups[0]?.items.map((entry) => entry.id)).toEqual([2, 3, 1])
  })

  it('не теряет жанр вне списка советов', () => {
    // Сегодня все жанры enum'а есть в SUGGESTION_GENRES — проверяем узелок на будущее.
    const rareGenre = 'BOOK' as RecordGenre
    const groups = groupSuggestions([item({ id: 1, genre: rareGenre })], 'date')

    expect(groups.map((group) => group.key)).toContain(rareGenre)
  })

  it('пропускает записи без жанра и пустой вход', () => {
    expect(groupSuggestions([item({ genre: null })], 'date')).toEqual([])
    expect(groupSuggestions([], 'likes')).toEqual([])
    expect(isQueuedRecord(item({ type: RecordType.WRITTEN }))).toBe(true)
    expect(isQueuedRecord(item({ type: RecordType.SUGGESTION }))).toBe(false)
  })
})
