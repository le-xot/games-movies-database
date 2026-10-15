<script setup lang="ts">
import { computed } from 'vue'
import { useWordleDrag } from '@/pages/wordle/composables/use-wordle-drag'

const { dragState } = useWordleDrag()

/** Бросок за пределы доски удалит букву — подсвечиваем призрак. */
const willDelete = computed(() => {
  const drag = dragState.value
  if (!drag || drag.source.kind !== 'board') return false
  return drag.targetCell === null && !drag.overBoard
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="dragState"
      data-wordle-drag-ghost
      aria-hidden="true"
      class="pointer-events-none fixed z-50 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center border-2 bg-zinc-800 font-bold uppercase"
      :class="
        willDelete
          ? 'border-red-400/80 text-red-300 opacity-70'
          : 'border-zinc-400 text-white opacity-95'
      "
      :style="{
        left: `${dragState.x}px`,
        top: `${dragState.y}px`,
        width: `${dragState.size}px`,
        height: `${dragState.size}px`,
        fontSize: `${Math.round(dragState.size * 0.45)}px`,
      }"
    >
      {{ dragState.letter }}
    </div>
  </Teleport>
</template>
