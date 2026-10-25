<script setup lang="ts">
import { useMediaQuery } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { computed, ref, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { WordleGameStatus } from '@/lib/api'
import WordleBoard from '@/pages/wordle/components/WordleBoard.vue'
import WordleDragGhost from '@/pages/wordle/components/WordleDragGhost.vue'
import WordleKeyboard from '@/pages/wordle/components/WordleKeyboard.vue'
import WordleResultDialog from '@/pages/wordle/components/WordleResultDialog.vue'
import { useWordle } from '@/pages/wordle/composables/use-wordle'
import { useWordleKeyboard } from '@/pages/wordle/composables/use-wordle-keyboard'
import { WORDLE_MAX_ATTEMPTS, WORDLE_WORD_LENGTH } from '@/pages/wordle/constants/wordle-constants'

const wordle = useWordle()
const {
  practiceState,
  practiceError,
  isPracticeLoading,
  isStartingPractice,
  guessCells,
  isShaking,
  letterStates,
  isInputLocked,
  isFinished,
} = storeToRefs(wordle)

const isDesktop = useMediaQuery('(min-width: 1280px)')
const isResultOpen = ref(false)

// Автостарт только на `null` (нет сессии). `undefined` — запрос ещё грузится, стартовать нельзя.
watch(
  [practiceState, practiceError],
  () => {
    if (practiceError.value) return
    if (practiceState.value === null && !isPracticeLoading.value) {
      void wordle.startNewPracticeRound()
    }
  },
  { immediate: true },
)

watch(
  () => practiceState.value?.status,
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

useWordleKeyboard({
  onLetter: (letter) => {
    if (isResultOpen.value) return
    wordle.addLetter(letter)
  },
  onEnter: () => {
    if (isResultOpen.value) return
    void wordle.submitCurrentGuess()
  },
  onBackspace: () => {
    if (isResultOpen.value) return
    wordle.removeLetter()
  },
})

const hasError = computed(() => Boolean(practiceError.value))

async function playAgain() {
  isResultOpen.value = false
  await wordle.startNewPracticeRound()
}
</script>

<template>
  <div
    data-wordle-practice
    class="wordle-practice relative flex min-h-[calc(100dvh-176px)] flex-col xl:min-h-[calc(100dvh-108px)] xl:justify-center"
  >
    <p class="mb-3 text-center text-xs text-muted-foreground">
      Тренировка не влияет на статистику и серию
    </p>

    <div v-if="hasError" class="flex flex-1 flex-col items-center justify-center gap-3">
      <p class="text-sm text-muted-foreground">Не удалось загрузить тренировку</p>
      <Button variant="secondary" @click="wordle.refetchPractice()">Повторить</Button>
    </div>

    <div v-else class="flex flex-1 flex-col gap-4 xl:flex-none">
      <!-- Скелетона здесь нет намеренно: у тренировки есть собственное пустое
           состояние с кнопкой старта, а клавиатура до загрузки видимо disabled. -->
      <div class="flex flex-1 items-center justify-center xl:flex-none">
        <WordleBoard
          :guesses="practiceState?.guesses ?? []"
          :cells="guessCells"
          :word-length="WORDLE_WORD_LENGTH"
          :max-attempts="WORDLE_MAX_ATTEMPTS"
          :shaking="isShaking"
          :disabled="isInputLocked"
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

      <div class="flex flex-col items-center gap-1">
        <p v-if="isFinished" class="text-sm text-muted-foreground">
          Слово:
          <span class="font-semibold uppercase text-foreground">{{ practiceState?.answer }}</span>
        </p>
        <Button
          v-if="isFinished"
          variant="secondary"
          :disabled="isStartingPractice"
          @click="playAgain"
        >
          Ещё слово
        </Button>
        <Button
          v-else
          variant="ghost"
          size="sm"
          :disabled="isStartingPractice || isPracticeLoading"
          @click="playAgain"
        >
          Другое слово
        </Button>
      </div>
    </div>

    <WordleResultDialog
      v-model:open="isResultOpen"
      mode="practice"
      :status="practiceState?.status ?? WordleGameStatus.IN_PROGRESS"
      :answer="practiceState?.answer ?? null"
      :attempts="practiceState?.attempts ?? 0"
      :current-streak="0"
      @play-again="playAgain"
    />

    <WordleDragGhost />
  </div>
</template>

<style scoped>
/* Те же размеры доски/клавиатуры, что и в дневном режиме (WordleGame.vue). */
.wordle-practice {
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
  .wordle-practice {
    --wordle-key: min(64px, 6.8dvh);
    --wordle-key-text: min(17px, 2.2dvh);
    --wordle-key-icon: min(24px, 3dvh);
  }
}
</style>
