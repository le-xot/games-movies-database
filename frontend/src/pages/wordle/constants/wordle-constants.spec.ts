import { describe, expect, it } from 'bun:test'
import {
  firstEmptyIndex,
  lastFilledIndex,
  moveLetterInCells,
  placeLetterInCells,
} from '@/pages/wordle/constants/wordle-constants'

describe('placeLetterInCells', () => {
  it('puts the letter exactly into the target cell, keeping holes around it', () => {
    expect(placeLetterInCells(['к', null, null, null, null], 2, 'т')).toEqual([
      'к',
      null,
      'т',
      null,
      null,
    ])
  })

  it('replaces the letter already in the cell', () => {
    expect(placeLetterInCells(['к', 'т'], 1, 'а')).toEqual(['к', 'а'])
  })

  it('clears a cell when the letter is null', () => {
    expect(placeLetterInCells(['к', 'т'], 0, null)).toEqual([null, 'т'])
  })

  it('ignores indexes outside the row', () => {
    expect(placeLetterInCells(['к', null], 5, 'а')).toEqual(['к', null])
    expect(placeLetterInCells(['к', null], -1, 'а')).toEqual(['к', null])
  })
})

describe('moveLetterInCells', () => {
  it('moves a letter into an empty cell and leaves a hole behind', () => {
    expect(moveLetterInCells(['а', null, null], 0, 2)).toEqual([null, null, 'а'])
  })

  it('swaps letters when the target cell is occupied', () => {
    expect(moveLetterInCells(['а', 'б', 'в'], 0, 2)).toEqual(['в', 'б', 'а'])
  })

  it('keeps the row when the source is empty or the target is its own cell', () => {
    expect(moveLetterInCells(['а', null], 0, 0)).toEqual(['а', null])
    expect(moveLetterInCells([null, 'а'], 0, 1)).toEqual([null, 'а'])
  })

  it('ignores indexes outside the row', () => {
    expect(moveLetterInCells(['а', null], 0, 5)).toEqual(['а', null])
    expect(moveLetterInCells(['а', null], 5, 0)).toEqual(['а', null])
    expect(moveLetterInCells(['а', null], -1, 0)).toEqual(['а', null])
  })
})

describe('firstEmptyIndex', () => {
  it('finds the leftmost empty cell', () => {
    expect(firstEmptyIndex(['а', 'б', null, 'в', null])).toBe(2)
    expect(firstEmptyIndex([null, 'а'])).toBe(0)
  })

  it('returns -1 for a full row', () => {
    expect(firstEmptyIndex(['а', 'б'])).toBe(-1)
  })
})

describe('lastFilledIndex', () => {
  it('finds the rightmost filled cell', () => {
    expect(lastFilledIndex(['а', null, 'в', null])).toBe(2)
    expect(lastFilledIndex([null, 'а'])).toBe(1)
  })

  it('returns -1 for an empty row', () => {
    expect(lastFilledIndex([null, null])).toBe(-1)
  })
})
