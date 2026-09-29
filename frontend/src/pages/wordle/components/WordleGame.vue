<script setup lang="ts">
import { BarChart3, Trophy } from '@lucide/vue'
import { useMediaQuery } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { WordleGameStatus } from '@/lib/api'
import WordleBoard from '@/pages/wordle/components/WordleBoard.vue'
import WordleKeyboard from '@/pages/wordle/components/WordleKeyboard.vue'
import WordleResultDialog from '@/pages/wordle/components/WordleResultDialog.vue'
import WordleSidePanel from '@/pages/wordle/components/WordleSidePanel.vue'
import WordleStatsDialog from '@/pages/wordle/components/WordleStatsDialog.vue'
import { useWordle } from '@/pages/wordle/composables/use-wordle'
import { useWordleKeyboard } from '@/pages/wordle/composables/use-wordle-keyboard'
import { WORDLE_MAX_ATTEMPTS, WORDLE_WORD_LENGTH } from '@/pages/wordle/constants/wordle-constants'

const wordle = useWordle()
const { state, stats, currentGuess, isShaking, letterStates, isInputLocked, isFinished } =
  storeToRefs(wordle)

const isDesktop = useMediaQuery('(min-width: 1280px)')
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
    if (
      previous === WordleGameStatus.IN_PROGRESS &&
      status !== WordleGameStatus.IN_PROGRESS &&
      !isDesktop.value
    ) {
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

const dayProgress = computed(() => {
  if (timeLeft.value === null) return 0
  return 1 - Math.min(Math.max(timeLeft.value / 86_400_000, 0), 1)
})
</script>

<template>
  <div
    class="wordle-play relative flex min-h-[calc(100dvh-132px)] flex-col xl:min-h-[calc(100dvh-64px)] xl:justify-center"
  >
    <div class="flex flex-1 flex-col xl:flex-none xl:pr-[300px]">
      <div
        class="flex flex-1 flex-col gap-4 xl:mx-auto xl:w-[var(--wordle-keyboard-width,600px)] xl:flex-none xl:gap-6"
      >
        <div class="flex items-center justify-between gap-2 xl:hidden">
          <span class="text-sm text-muted-foreground">
            <span class="hidden sm:inline">Новое слово через </span>{{ countdown }}
          </span>
          <div class="flex gap-2">
            <Button
              variant="secondary"
              size="icon"
              aria-label="Результат"
              :disabled="!isFinished"
              @click="isResultOpen = true"
            >
              <Trophy class="size-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              aria-label="Статистика"
              @click="isStatsOpen = true"
            >
              <BarChart3 class="size-4" />
            </Button>
          </div>
        </div>

        <div class="flex flex-1 items-center justify-center xl:flex-none">
          <WordleBoard
            :guesses="state?.guesses ?? []"
            :current-guess="currentGuess"
            :word-length="WORDLE_WORD_LENGTH"
            :max-attempts="WORDLE_MAX_ATTEMPTS"
            :shaking="isShaking"
          />
        </div>

        <WordleKeyboard
          class="mt-auto xl:mt-0"
          :letter-states="letterStates"
          :disabled="isInputLocked"
          @letter="wordle.addLetter"
          @enter="wordle.submitCurrentGuess()"
          @backspace="wordle.removeLetter"
        />
      </div>
    </div>

    <WordleSidePanel
      class="xl:absolute xl:right-0 xl:top-1/2 xl:-translate-y-1/2"
      :countdown="countdown"
      :progress="dayProgress"
    />

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

<style scoped>
.wordle-play {
  --wordle-tile: min(52px, 7dvh);
  --wordle-tile-sm: min(68px, 7.6dvh);
  --wordle-letter: min(24px, 3.2dvh);
  --wordle-letter-sm: min(32px, 3.6dvh);
  --wordle-gap: min(6px, 0.8dvh);
  --wordle-key: min(48px, 5.6dvh);
  --wordle-key-text: min(14px, 1.8dvh);
  --wordle-key-icon: min(20px, 2.6dvh);
  --wordle-keyboard-width: 600px;
}

@media (min-width: 640px) {
  .wordle-play {
    --wordle-key: min(64px, 6.8dvh);
    --wordle-key-text: min(17px, 2.2dvh);
    --wordle-key-icon: min(24px, 3dvh);
  }
}
</style>
