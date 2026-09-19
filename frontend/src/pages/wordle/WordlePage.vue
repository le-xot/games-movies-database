<script setup lang="ts">
import { BarChart3, Trophy } from '@lucide/vue'
import { storeToRefs } from 'pinia'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { WordleGameStatus } from '@/lib/api'
import WordleBoard from '@/pages/wordle/components/WordleBoard.vue'
import WordleKeyboard from '@/pages/wordle/components/WordleKeyboard.vue'
import WordleResultDialog from '@/pages/wordle/components/WordleResultDialog.vue'
import WordleStatsDialog from '@/pages/wordle/components/WordleStatsDialog.vue'
import { useWordle } from '@/pages/wordle/composables/use-wordle'
import { useWordleKeyboard } from '@/pages/wordle/composables/use-wordle-keyboard'
import { WORDLE_MAX_ATTEMPTS, WORDLE_WORD_LENGTH } from '@/pages/wordle/constants/wordle-constants'

const wordle = useWordle()
const { state, stats, currentGuess, isShaking, letterStates, isInputLocked, isFinished } =
  storeToRefs(wordle)

const isStatsOpen = ref(false)
const isResultOpen = ref(false)
const timeLeft = ref<number | null>(null)

let timer: ReturnType<typeof setInterval> | undefined

watch(
  () => state.value?.msUntilNextWord,
  (ms) => {
    if (typeof ms === 'number') timeLeft.value = ms
  },
  { immediate: true },
)

watch(
  () => state.value?.status,
  (status, previous) => {
    if (previous === WordleGameStatus.IN_PROGRESS && status !== WordleGameStatus.IN_PROGRESS) {
      isResultOpen.value = true
    }
  },
)

watch(
  () => state.value?.date,
  (date, previous) => {
    if (previous && date && date !== previous) {
      isResultOpen.value = false
      wordle.resetLocalInput()
    }
  },
)

onMounted(() => {
  if (state.value) void wordle.refreshAll()

  timer = setInterval(() => {
    if (timeLeft.value === null || timeLeft.value <= 0) return

    timeLeft.value -= 1000
    if (timeLeft.value <= 0) {
      timeLeft.value = 60_000
      wordle.resetLocalInput()
      void wordle.refreshAll()
    }
  }, 1000)
})

onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
})

useWordleKeyboard({
  onLetter: (letter) => {
    if (isStatsOpen.value || isResultOpen.value) return
    wordle.addLetter(letter)
  },
  onEnter: () => {
    if (isStatsOpen.value || isResultOpen.value) return
    void wordle.submitCurrentGuess()
  },
  onBackspace: () => {
    if (isStatsOpen.value || isResultOpen.value) return
    wordle.removeLetter()
  },
})

const countdown = computed(() => {
  const totalSeconds = Math.floor((timeLeft.value ?? 0) / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':')
})
</script>

<template>
  <div class="flex flex-col items-center gap-5">
    <div class="flex w-full max-w-[500px] items-center justify-between gap-2">
      <span class="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
        Новое слово через {{ countdown }}
      </span>
      <div class="flex gap-2">
        <Button
          v-if="isFinished"
          variant="secondary"
          size="icon"
          aria-label="Результат"
          @click="isResultOpen = true"
        >
          <Trophy class="size-4" />
        </Button>
        <Button variant="secondary" size="icon" aria-label="Статистика" @click="isStatsOpen = true">
          <BarChart3 class="size-4" />
        </Button>
      </div>
    </div>

    <WordleBoard
      :guesses="state?.guesses ?? []"
      :current-guess="currentGuess"
      :word-length="WORDLE_WORD_LENGTH"
      :max-attempts="WORDLE_MAX_ATTEMPTS"
      :shaking="isShaking"
    />

    <WordleKeyboard
      :letter-states="letterStates"
      :disabled="isInputLocked"
      @letter="wordle.addLetter"
      @enter="wordle.submitCurrentGuess()"
      @backspace="wordle.removeLetter"
    />

    <p class="text-center text-xs text-muted-foreground">
      Угадайте слово из {{ WORDLE_WORD_LENGTH }} букв за {{ WORDLE_MAX_ATTEMPTS }} попыток
    </p>

    <WordleStatsDialog v-model:open="isStatsOpen" />
    <WordleResultDialog
      v-model:open="isResultOpen"
      :status="state?.status ?? WordleGameStatus.IN_PROGRESS"
      :answer="state?.answer ?? null"
      :attempts="state?.attempts ?? 0"
      :current-streak="stats?.currentStreak ?? 0"
      @show-stats="isStatsOpen = true"
    />
  </div>
</template>
