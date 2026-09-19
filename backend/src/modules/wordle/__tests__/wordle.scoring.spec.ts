import { describe, expect, it } from 'bun:test'
import { WordleLetterState, scoreGuess } from '@/modules/wordle/wordle.scoring'

const { CORRECT, PRESENT, ABSENT } = WordleLetterState

describe('scoreGuess', () => {
  it('marks the exact match as all correct', () => {
    expect(scoreGuess('слово', 'слово')).toEqual([CORRECT, CORRECT, CORRECT, CORRECT, CORRECT])
  })

  it('marks letters as absent when the answer has none of them', () => {
    expect(scoreGuess('слово', 'птица')).toEqual([ABSENT, ABSENT, ABSENT, ABSENT, ABSENT])
  })

  it('marks present letters that exist in other positions', () => {
    expect(scoreGuess('слово', 'ослон')).toEqual([PRESENT, PRESENT, PRESENT, PRESENT, ABSENT])
  })

  it('does not reuse a single letter twice', () => {
    expect(scoreGuess('океан', 'кокос')).toEqual([PRESENT, PRESENT, ABSENT, ABSENT, ABSENT])
  })

  it('prefers exact matches over present matches for duplicates', () => {
    expect(scoreGuess('кокос', 'кокок')).toEqual([CORRECT, CORRECT, CORRECT, CORRECT, ABSENT])
  })

  it('marks only one of two guessed letters when the answer has one', () => {
    expect(scoreGuess('баран', 'атака')).toEqual([PRESENT, ABSENT, PRESENT, ABSENT, ABSENT])
  })
})
