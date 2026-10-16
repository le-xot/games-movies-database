import { describe, expect, it } from 'bun:test'
import { pluralRu } from './plural-ru'

const RATINGS = ['оценка', 'оценки', 'оценок'] as const

describe('pluralRu', () => {
  it.each([
    [0, 'оценок'],
    [1, 'оценка'],
    [2, 'оценки'],
    [4, 'оценки'],
    [5, 'оценок'],
    [11, 'оценок'],
    [12, 'оценок'],
    [14, 'оценок'],
    [21, 'оценка'],
    [22, 'оценки'],
    [25, 'оценок'],
    [101, 'оценка'],
    [111, 'оценок'],
  ])('picks the right form for %p', (count, expected) => {
    expect(pluralRu(count, RATINGS)).toBe(expected)
  })
})
