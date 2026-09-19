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
    if (guess[i] === answer[i]) {
      states[i] = WordleLetterState.CORRECT
    } else {
      const letter = answer[i]
      remaining.set(letter, (remaining.get(letter) ?? 0) + 1)
    }
  }

  for (let i = 0; i < guess.length; i++) {
    if (states[i] === WordleLetterState.CORRECT) continue
    const left = remaining.get(guess[i]) ?? 0
    if (left > 0) {
      states[i] = WordleLetterState.PRESENT
      remaining.set(guess[i], left - 1)
    }
  }

  return states
}
