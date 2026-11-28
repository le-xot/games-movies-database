import { describe, expect, it } from 'bun:test'
import { WordleLetterState } from '@/lib/api'
import {
  firstEmptyIndex,
  hintLetters,
  lastFilledIndex,
  moveLetterInCells,
  placeLetterInCells,
} from '@/pages/wordle/constants/wordle-constants'

const { CORRECT, PRESENT, ABSENT } = WordleLetterState

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

describe('hintLetters', () => {
  it('returns an empty row without guesses', () => {
    expect(hintLetters([], 5)).toEqual([null, null, null, null, null])
  })

  it('takes the letter from the position guessed green', () => {
    expect(
      hintLetters([{ word: 'зебра', states: [ABSENT, CORRECT, ABSENT, ABSENT, ABSENT] }], 5),
    ).toEqual([null, 'е', null, null, null])
  })

  it('keeps the greens gathered in earlier guesses', () => {
    expect(
      hintLetters(
        [
          { word: 'зебра', states: [ABSENT, CORRECT, ABSENT, ABSENT, ABSENT] },
          { word: 'кобра', states: [CORRECT, ABSENT, ABSENT, ABSENT, ABSENT] },
        ],
        5,
      ),
    ).toEqual(['к', 'е', null, null, null])
  })

  it('keeps a green position after a miss in the following guess', () => {
    expect(
      hintLetters(
        [
          { word: 'зебра', states: [ABSENT, CORRECT, ABSENT, ABSENT, ABSENT] },
          { word: 'ежики', states: [ABSENT, ABSENT, PRESENT, ABSENT, ABSENT] },
        ],
        5,
      ),
    ).toEqual([null, 'е', null, null, null])
  })

  it('ignores present and absent letters', () => {
    const guesses = [{ word: 'кокос', states: [ABSENT, PRESENT, PRESENT, ABSENT, ABSENT] }]
    expect(hintLetters(guesses, 5)).toEqual([null, null, null, null, null])
  })

  it('stops at the requested word length', () => {
    const guesses = [{ word: 'слово', states: [CORRECT, CORRECT, CORRECT, CORRECT, CORRECT] }]
    expect(hintLetters(guesses, 3)).toEqual(['с', 'л', 'о'])
  })
})
