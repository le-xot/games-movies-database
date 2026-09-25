import { useMutation, useQuery, useQueryCache } from '@pinia/colada'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { toast } from 'vue-sonner'
import { WORDLE_LEADERBOARD_KEY } from '@/composables/query-keys'
import { WordleGameStatus } from '@/lib/api'
import {
  LETTER_STATE_RANK,
  WORDLE_WORD_LENGTH,
  normalizeWordleWord,
} from '@/pages/wordle/constants/wordle-constants'
import { useApi } from '@/stores/use-api'
import type {
  WordleGameStatus as WordleGameStatusValue,
  WordleLeaderboardDTO,
  WordleLetterState,
  WordleStateDTO,
  WordleStatsDTO,
} from '@/lib/api'

export const WORDLE_STATE_KEY = 'wordle/state'
export const WORDLE_STATS_KEY = 'wordle/stats'

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

  const currentGuess = ref('')
  const isShaking = ref(false)

  const {
    data: state,
    isLoading: isStateLoading,
    refetch: refetchState,
  } = useQuery<WordleStateDTO>({
    key: [WORDLE_STATE_KEY],
    query: async () => (await api.wordle.wordleControllerGetState()).data,
    gcTime: false,
  })

  const { data: stats, refetch: refetchStats } = useQuery<WordleStatsDTO>({
    key: [WORDLE_STATS_KEY],
    query: async () => (await api.wordle.wordleControllerGetStats()).data,
    gcTime: false,
  })

  const { data: leaderboard, refetch: refetchLeaderboard } = useQuery<WordleLeaderboardDTO>({
    key: [WORDLE_LEADERBOARD_KEY],
    query: async () => (await api.wordle.wordleControllerGetLeaderboard()).data,
    gcTime: false,
  })

  const { mutateAsync: submitGuess, isLoading: isSubmitting } = useMutation({
    key: [WORDLE_STATE_KEY, 'guess'],
    mutation: async (word: string) => {
      const { data } = await api.wordle.wordleControllerMakeGuess({ word })
      return data
    },
    onSuccess: (data) => {
      queryCache.setQueryData([WORDLE_STATE_KEY], data)
      void queryCache.invalidateQueries({ key: [WORDLE_STATS_KEY] }).catch(() => {})
      void queryCache.invalidateQueries({ key: [WORDLE_LEADERBOARD_KEY] }).catch(() => {})
    },
  })

  const status = computed<WordleGameStatusValue>(
    () => state.value?.status ?? WordleGameStatus.IN_PROGRESS,
  )
  const isFinished = computed(() => status.value !== WordleGameStatus.IN_PROGRESS)
  const isInputLocked = computed(
    () => isSubmitting.value || isFinished.value || isStateLoading.value,
  )

  const letterStates = computed<Partial<Record<string, WordleLetterState>>>(() => {
    const result: Partial<Record<string, WordleLetterState>> = {}

    for (const guess of state.value?.guesses ?? []) {
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

  function addLetter(letter: string) {
    if (isInputLocked.value) return
    const normalized = normalizeWordleWord(letter)
    if (!/^[а-я]$/.test(normalized)) return
    if (currentGuess.value.length >= WORDLE_WORD_LENGTH) return
    currentGuess.value += normalized
  }

  function removeLetter() {
    if (isInputLocked.value) return
    currentGuess.value = currentGuess.value.slice(0, -1)
  }

  async function submitCurrentGuess() {
    if (isSubmitting.value || isFinished.value) return
    if (currentGuess.value.length < WORDLE_WORD_LENGTH) {
      shake()
      return
    }

    const word = currentGuess.value
    try {
      await submitGuess(word)
      currentGuess.value = ''
    } catch (error) {
      shake()
      toast.error('Ошибка', {
        description: extractErrorMessage(error, 'Не удалось отправить слово'),
      })
    }
  }

  function resetLocalInput() {
    currentGuess.value = ''
  }

  async function refreshAll() {
    await Promise.allSettled([refetchState(), refetchStats(), refetchLeaderboard()])
  }

  return {
    state,
    stats,
    leaderboard,
    status,
    isFinished,
    isInputLocked,
    isStateLoading,
    isSubmitting,
    currentGuess,
    isShaking,
    letterStates,
    addLetter,
    removeLetter,
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
