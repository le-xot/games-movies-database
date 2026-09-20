<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { LETTER_STATE_CLASS } from '@/pages/wordle/constants/wordle-constants'
import type { WordleGuessStateDTO, WordleLetterState } from '@/lib/api'

const props = defineProps<{
  guesses: WordleGuessStateDTO[]
  currentGuess: string
  wordLength: number
  maxAttempts: number
  shaking: boolean
}>()

interface BoardCell {
  letter: string
  state?: WordleLetterState
}

const emptyRow = () => Array.from({ length: props.wordLength }, () => ({ letter: '' }))

const rows = computed<BoardCell[][]>(() => {
  const result: BoardCell[][] = []

  for (let index = 0; index < props.maxAttempts; index++) {
    const guess = props.guesses[index]

    if (guess) {
      result.push(
        guess.word.split('').map((letter, letterIndex) => ({
          letter,
          state: guess.states[letterIndex],
        })),
      )
      continue
    }

    if (index === props.guesses.length) {
      const letters = props.currentGuess.split('')
      result.push(
        Array.from({ length: props.wordLength }, (_, letterIndex) => ({
          letter: letters[letterIndex] ?? '',
        })),
      )
      continue
    }

    result.push(emptyRow())
  }

  return result
})

const animatedRow = ref(-1)
const isMounted = ref(false)

watch(
  () => props.guesses.length,
  (length, previous) => {
    if (!isMounted.value || length <= previous) return
    animatedRow.value = length - 1
    setTimeout(() => {
      animatedRow.value = -1
    }, 800)
  },
)

onMounted(() => {
  isMounted.value = true
})
</script>

<template>
  <div class="flex flex-col gap-[var(--wordle-gap,6px)]" role="grid" aria-label="Игровое поле">
    <div
      v-for="(row, rowIndex) in rows"
      :key="rowIndex"
      class="flex justify-center gap-[var(--wordle-gap,6px)]"
      :class="{ 'animate-shake': shaking && rowIndex === props.guesses.length }"
    >
      <div
        v-for="(cell, cellIndex) in row"
        :key="cellIndex"
        class="flex size-[var(--wordle-tile,52px)] items-center justify-center border-2 text-[length:var(--wordle-letter,24px)] font-bold uppercase sm:size-[var(--wordle-tile-sm,62px)] sm:text-[length:var(--wordle-letter-sm,30px)]"
        :class="[
          cell.state
            ? LETTER_STATE_CLASS[cell.state]
            : cell.letter
              ? 'border-zinc-500 bg-transparent text-white'
              : 'border-zinc-700 bg-transparent text-white',
          animatedRow === rowIndex ? 'animate-flip' : '',
        ]"
        :style="animatedRow === rowIndex ? { animationDelay: `${cellIndex * 120}ms` } : undefined"
      >
        {{ cell.letter }}
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes wordle-flip {
  0% {
    transform: rotateX(0deg);
  }
  50% {
    transform: rotateX(90deg);
  }
  100% {
    transform: rotateX(0deg);
  }
}

@keyframes wordle-shake {
  0%,
  100% {
    transform: translateX(0);
  }
  20%,
  60% {
    transform: translateX(-6px);
  }
  40%,
  80% {
    transform: translateX(6px);
  }
}

.animate-flip {
  animation: wordle-flip 600ms ease both;
}

.animate-shake {
  animation: wordle-shake 400ms ease;
}
</style>
