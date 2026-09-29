<script setup lang="ts">
import { computed } from 'vue'
import { useWordleSettings } from '@/pages/wordle/composables/use-wordle-settings'
import {
  COLORBLIND_LETTER_STATE_CLASS,
  LETTER_STATE_CLASS,
} from '@/pages/wordle/constants/wordle-constants'
import type { WordleLetterState } from '@/lib/api'

const props = defineProps<{
  guesses: { states: WordleLetterState[] }[]
}>()

const { isColorblind } = useWordleSettings()

const letterStateClass = computed(() =>
  isColorblind.value ? COLORBLIND_LETTER_STATE_CLASS : LETTER_STATE_CLASS,
)
</script>

<template>
  <div class="flex flex-col items-center gap-1" role="img" aria-label="Сетка попыток">
    <div v-for="(guess, rowIndex) in props.guesses" :key="rowIndex" class="flex gap-1">
      <span
        v-for="(state, cellIndex) in guess.states"
        :key="cellIndex"
        class="size-3 rounded-[2px]"
        :class="letterStateClass[state]"
      />
    </div>
  </div>
</template>
