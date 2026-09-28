export const WordleLetterState = {
  CORRECT: 'CORRECT',
  PRESENT: 'PRESENT',
  ABSENT: 'ABSENT',
} as const
export type WordleLetterState = (typeof WordleLetterState)[keyof typeof WordleLetterState]

export function scoreGuess(answer: string, guess: string): WordleLetterState[] {
  const states: WordleLetterState[] = new Array(guess.length).fill(WordleLetterState.ABSENT)
  const remaining = new Map<string, number>()

  for (let i = 0; i < guess.length; i++) {
    const guessLetter = guess[i]
    const answerLetter = answer[i]
    if (guessLetter === undefined || answerLetter === undefined) continue
    if (guessLetter === answerLetter) {
      states[i] = WordleLetterState.CORRECT
    } else {
      remaining.set(answerLetter, (remaining.get(answerLetter) ?? 0) + 1)
    }
  }

  for (let i = 0; i < guess.length; i++) {
    if (states[i] === WordleLetterState.CORRECT) continue
    const guessLetter = guess[i]
    if (guessLetter === undefined) continue
    const left = remaining.get(guessLetter) ?? 0
    if (left > 0) {
      states[i] = WordleLetterState.PRESENT
      remaining.set(guessLetter, left - 1)
    }
  }

  return states
}
