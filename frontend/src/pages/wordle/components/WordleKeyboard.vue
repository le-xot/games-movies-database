<script setup lang="ts">
import { Delete } from '@lucide/vue'
import { KEY_STATE_CLASS, WORDLE_KEYBOARD_ROWS } from '@/pages/wordle/constants/wordle-constants'
import type { WordleLetterState } from '@/lib/api'

const props = defineProps<{
  letterStates: Partial<Record<string, WordleLetterState>>
  disabled?: boolean
}>()

const emit = defineEmits<{
  letter: [letter: string]
  enter: []
  backspace: []
}>()

function keyClass(key: string) {
  const state = props.letterStates[key]
  return state ? KEY_STATE_CLASS[state] : 'bg-zinc-600 text-white'
}

function handleKey(key: string) {
  if (props.disabled) return
  if (key === 'enter') {
    emit('enter')
    return
  }
  if (key === 'backspace') {
    emit('backspace')
    return
  }
  emit('letter', key)
}
</script>

<template>
  <div class="flex w-full max-w-[500px] flex-col gap-1.5 px-1" aria-label="Клавиатура">
    <div
      v-for="(row, rowIndex) in WORDLE_KEYBOARD_ROWS"
      :key="rowIndex"
      class="flex justify-center gap-1"
    >
      <button
        v-for="key in row"
        :key="key"
        type="button"
        class="flex h-12 min-w-0 flex-1 select-none items-center justify-center rounded text-sm font-semibold uppercase transition-colors active:opacity-70 disabled:opacity-50"
        :class="[keyClass(key), key.length > 1 ? 'grow-[1.5] text-xs' : '']"
        :disabled="disabled"
        @click="handleKey(key)"
      >
        <Delete v-if="key === 'backspace'" class="size-5" />
        <span v-else-if="key === 'enter'">Ввод</span>
        <span v-else>{{ key }}</span>
      </button>
    </div>
  </div>
</template>
