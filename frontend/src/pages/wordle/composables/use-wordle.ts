import { useMutation, useQuery, useQueryCache } from '@pinia/colada'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { toast } from 'vue-sonner'
import { WORDLE_LEADERBOARD_KEY } from '@/composables/query-keys'
import { WordleGameStatus, WordleHistoryStatus, unwrap } from '@/lib/api'
import {
  LETTER_STATE_RANK,
  WORDLE_WORD_LENGTH,
  emptyGuessCells,
  firstEmptyIndex,
  lastFilledIndex,
  moveLetterInCells,
  normalizeWordleWord,
  placeLetterInCells,
} from '@/pages/wordle/constants/wordle-constants'
import { useApi } from '@/stores/use-api'
import type {
  WordleGameStatus as WordleGameStatusValue,
  WordleLeaderboardDTO,
  WordleLetterState,
  WordlePracticeStateDTO,
  WordleStateDTO,
  WordleStatsDTO,
} from '@/lib/api'

export const WORDLE_STATE_KEY = 'wordle/state'
export const WORDLE_STATS_KEY = 'wordle/stats'
export const WORDLE_PRACTICE_KEY = 'wordle/practice'

export type WordleMode = 'daily' | 'practice'

function extractErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'error' in error) {
    const body = (error as { error?: { message?: string | string[] } }).error
    const message = body?.message
    if (Array.isArray(message)) return message[0] ?? fallback
    if (typeof message === 'string') return message
  }
  return fallback
}

export const useWordle = defineStore('wordle/use-wordle', () => {
  const api = useApi()
  const queryCache = useQueryCache()

  const mode = ref<WordleMode>('daily')
  const guessCells = ref(emptyGuessCells(WORDLE_WORD_LENGTH))
  const isShaking = ref(false)

  const {
    data: state,
    isLoading: isDailyStateLoading,
    refetch: refetchState,
  } = useQuery<WordleStateDTO>({
    key: [WORDLE_STATE_KEY],
    query: () => unwrap(api.wordle.state.get()),
    gcTime: false,
  })

  const { data: stats, refetch: refetchStats } = useQuery<WordleStatsDTO>({
    key: [WORDLE_STATS_KEY],
    query: () => unwrap(api.wordle.stats.get()),
    gcTime: false,
  })

  const { data: leaderboard, refetch: refetchLeaderboard } = useQuery<WordleLeaderboardDTO>({
    key: [WORDLE_LEADERBOARD_KEY],
    query: () => unwrap(api.wordle.leaderboard.get()),
    gcTime: false,
  })

  const { mutateAsync: submitDailyGuess, isLoading: isSubmittingDaily } = useMutation({
    key: [WORDLE_STATE_KEY, 'guess'],
    mutation: (word: string) => {
      return unwrap(api.wordle.guess.post({ word }))
    },
    onSuccess: (data) => {
      queryCache.setQueryData([WORDLE_STATE_KEY], data)
      void queryCache.invalidateQueries({ key: [WORDLE_STATS_KEY] }).catch(() => {})
      void queryCache.invalidateQueries({ key: [WORDLE_LEADERBOARD_KEY] }).catch(() => {})
    },
  })

  const {
    data: practiceState,
    isLoading: isPracticeLoading,
    error: practiceError,
    refetch: refetchPractice,
  } = useQuery<WordlePracticeStateDTO | null>({
    key: [WORDLE_PRACTICE_KEY],
    query: () => unwrap(api.wordle.practice.get()),
    gcTime: false,
  })

  const { mutateAsync: startPracticeRound, isLoading: isStartingPractice } = useMutation({
    key: [WORDLE_PRACTICE_KEY, 'start'],
    mutation: () => unwrap(api.wordle.practice.post()),
    onSuccess: (data) => {
      queryCache.setQueryData([WORDLE_PRACTICE_KEY], data)
    },
  })

  const { mutateAsync: submitPracticeGuess, isLoading: isSubmittingPractice } = useMutation({
    key: [WORDLE_PRACTICE_KEY, 'guess'],
    mutation: (word: string) => unwrap(api.wordle.practice.guess.post({ word })),
    onSuccess: (data) => {
      queryCache.setQueryData([WORDLE_PRACTICE_KEY], data)
    },
  })

  const isPractice = computed(() => mode.value === 'practice')
  const activeState = computed(() => (isPractice.value ? practiceState.value : state.value))

  const status = computed<WordleGameStatusValue>(
    () => activeState.value?.status ?? WordleGameStatus.IN_PROGRESS,
  )
  const isFinished = computed(() => status.value !== WordleGameStatus.IN_PROGRESS)
  const isSubmitting = computed(() =>
    isPractice.value ? isSubmittingPractice.value : isSubmittingDaily.value,
  )
  const isStateLoading = computed(() =>
    isPractice.value ? isPracticeLoading.value : isDailyStateLoading.value,
  )
  const isInputLocked = computed(
    () => isSubmitting.value || isFinished.value || isStateLoading.value,
  )

  const letterStates = computed<Partial<Record<string, WordleLetterState>>>(() => {
    const result: Partial<Record<string, WordleLetterState>> = {}

    for (const guess of activeState.value?.guesses ?? []) {
      guess.states.forEach((letterState, index) => {
        const letter = guess.word[index]
        if (!letter) return
        const current = result[letter]
        if (!current || LETTER_STATE_RANK[letterState] > LETTER_STATE_RANK[current]) {
          result[letter] = letterState
        }
      })
    }

    return result
  })

  function shake() {
    isShaking.value = true
    setTimeout(() => {
      isShaking.value = false
    }, 500)
  }

  function normalizeLetter(letter: string): string | null {
    const normalized = normalizeWordleWord(letter)
    return /^[а-я]$/.test(normalized) ? normalized : null
  }

  /** Ставит букву ровно в указанную клетку — бросок с клавиатуры. */
  function placeLetterAt(index: number, letter: string) {
    if (isInputLocked.value) return
    const normalized = normalizeLetter(letter)
    if (!normalized) return
    guessCells.value = placeLetterInCells(guessCells.value, index, normalized)
  }

  /** Набор буквы занимает самую левую пустую клетку. */
  function addLetter(letter: string) {
    const index = firstEmptyIndex(guessCells.value)
    if (index === -1) return
    placeLetterAt(index, letter)
  }

  function moveLetter(from: number, to: number) {
    if (isInputLocked.value) return
    guessCells.value = moveLetterInCells(guessCells.value, from, to)
  }

  /** Backspace стирает самую правую букву. */
  function removeLetter() {
    if (isInputLocked.value) return
    const index = lastFilledIndex(guessCells.value)
    if (index === -1) return
    guessCells.value = placeLetterInCells(guessCells.value, index, null)
  }

  /** Удаляет букву из конкретной клетки — бросок за пределы доски. */
  function removeLetterAt(index: number) {
    if (isInputLocked.value) return
    guessCells.value = placeLetterInCells(guessCells.value, index, null)
  }

  function resetGuessCells() {
    guessCells.value = emptyGuessCells(WORDLE_WORD_LENGTH)
  }

  async function submitCurrentGuess() {
    if (isSubmitting.value || isFinished.value) return
    const word = guessCells.value.map((cell) => cell ?? '').join('')
    if (word.length < WORDLE_WORD_LENGTH) {
      shake()
      return
    }

    if (isPractice.value) {
      try {
        await submitPracticeGuess(word)
        resetGuessCells()
      } catch (error) {
        shake()
        toast.error('Ошибка', {
          description: extractErrorMessage(error, 'Не удалось отправить слово'),
        })
      }
      return
    }

    const wasInProgress = status.value === WordleGameStatus.IN_PROGRESS
    try {
      const result = await submitDailyGuess(word)
      resetGuessCells()
      if (wasInProgress && result && result.status !== WordleGameStatus.IN_PROGRESS) {
        applyOptimisticStats(result)
      }
    } catch (error) {
      shake()
      toast.error('Ошибка', {
        description: extractErrorMessage(error, 'Не удалось отправить слово'),
      })
    }
  }

  /** Старт нового раунда тренировки — работает и как «Ещё слово», и как «Другое слово». */
  async function startNewPracticeRound() {
    try {
      await startPracticeRound()
      resetGuessCells()
    } catch (error) {
      shake()
      toast.error('Ошибка', {
        description: extractErrorMessage(error, 'Не удалось начать тренировку'),
      })
    }
  }

  function setMode(next: WordleMode) {
    if (mode.value === next) return
    mode.value = next
    resetGuessCells()
  }

  /** Мгновенно обновляет статистику завершённой партии до прихода refetch. */
  function applyOptimisticStats(finished: WordleStateDTO) {
    const current = stats.value
    if (!current) return

    const won = finished.status === WordleGameStatus.WON
    const played = current.played + 1
    const wins = current.wins + (won ? 1 : 0)
    const currentStreak = won ? current.currentStreak + 1 : 0

    queryCache.setQueryData([WORDLE_STATS_KEY], {
      ...current,
      played,
      wins,
      winRate: Math.round((wins / played) * 100),
      currentStreak,
      maxStreak: Math.max(current.maxStreak, currentStreak),
      history: current.history.map((day) =>
        day.date === finished.date
          ? { ...day, status: won ? WordleHistoryStatus.WON : WordleHistoryStatus.LOST }
          : day,
      ),
    })
  }

  function resetLocalInput() {
    resetGuessCells()
  }

  async function refreshAll() {
    await Promise.allSettled([refetchState(), refetchStats(), refetchLeaderboard()])
  }

  return {
    state,
    stats,
    leaderboard,
    mode,
    setMode,
    isPractice,
    practiceState,
    practiceError,
    isPracticeLoading,
    refetchPractice,
    isStartingPractice,
    startNewPracticeRound,
    status,
    isFinished,
    isInputLocked,
    isStateLoading,
    isSubmitting,
    guessCells,
    isShaking,
    letterStates,
    addLetter,
    placeLetterAt,
    moveLetter,
    removeLetter,
    removeLetterAt,
    submitCurrentGuess,
    resetLocalInput,
    refreshAll,
    refetchState,
    refetchStats,
    refetchLeaderboard,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useWordle, import.meta.hot))
}
