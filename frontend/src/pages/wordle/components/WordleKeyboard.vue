<script setup lang="ts">
import { CornerDownLeft, Delete } from '@lucide/vue'
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
  return state ? KEY_STATE_CLASS[state] : 'bg-zinc-500 text-white'
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
  <div
    class="flex w-full max-w-[var(--wordle-keyboard-width,500px)] flex-col gap-[var(--wordle-gap,6px)] px-1"
    aria-label="Клавиатура"
  >
    <div
      v-for="(row, rowIndex) in WORDLE_KEYBOARD_ROWS"
      :key="rowIndex"
      class="flex justify-center gap-[var(--wordle-gap,6px)]"
    >
      <button
        v-for="key in row"
        :key="key"
        type="button"
        class="flex h-[var(--wordle-key,48px)] min-w-0 flex-1 select-none items-center justify-center rounded text-[length:var(--wordle-key-text,0.875rem)] font-semibold uppercase transition-colors active:opacity-70 disabled:opacity-50"
        :class="[keyClass(key), key.length > 1 ? 'grow-[1.5]' : '']"
        :aria-label="key === 'enter' ? 'Ввод' : key === 'backspace' ? 'Удалить' : undefined"
        :disabled="disabled"
        @click="handleKey(key)"
      >
        <CornerDownLeft v-if="key === 'enter'" class="size-[var(--wordle-key-icon,20px)]" />
        <Delete v-else-if="key === 'backspace'" class="size-[var(--wordle-key-icon,20px)]" />
        <span v-else>{{ key }}</span>
      </button>
    </div>
  </div>
</template>
