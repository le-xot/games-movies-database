import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import { toast } from 'vue-sonner'
import { WordleGameStatus, WordleLetterState } from '@/lib/api'
import { useWordle } from '@/pages/wordle/composables/use-wordle'
import type { WordleStateDTO } from '@/lib/api'

const LETTER_EMOJI: Record<WordleLetterState, string> = {
  [WordleLetterState.CORRECT]: '🟩',
  [WordleLetterState.PRESENT]: '🟨',
  [WordleLetterState.ABSENT]: '⬛',
}

export function buildWordleShareText(state: WordleStateDTO, currentStreak: number): string {
  const [year, month, day] = state.date.split('-')
  const score =
    state.status === WordleGameStatus.WON
      ? `${state.attempts}/${state.maxAttempts}`
      : `X/${state.maxAttempts}`
  const streak =
    state.status === WordleGameStatus.WON && currentStreak > 0 ? ` · серия ${currentStreak}` : ''
  const grid = state.guesses
    .map((guess) => guess.states.map((letterState) => LETTER_EMOJI[letterState]).join(''))
    .join('\n')

  return `Вордли ${day}.${month}.${year} · ${score}${streak}\n\n${grid}`
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError'
}

export function useWordleShare() {
  const wordle = useWordle()
  const { state, stats } = storeToRefs(wordle)
  const isSharing = ref(false)

  async function shareResult() {
    const current = state.value
    if (!current || current.status === WordleGameStatus.IN_PROGRESS) return

    isSharing.value = true

    try {
      await wordle.refetchStats().catch(() => {})
      const text = buildWordleShareText(current, stats.value?.currentStreak ?? 0)

      if (typeof navigator !== 'undefined' && navigator.share) {
        try {
          await navigator.share({ text })
          return
        } catch (error) {
          if (isAbortError(error)) return
        }
      }

      await navigator.clipboard.writeText(text)
      toast.success('Результат скопирован')
    } catch {
      toast.error('Не удалось скопировать результат')
    } finally {
      isSharing.value = false
    }
  }

  return { shareResult, isSharing }
}
