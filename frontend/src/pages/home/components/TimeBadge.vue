<script setup lang="ts">
import {
  Clock,
  Clock1,
  Clock10,
  Clock11,
  Clock12,
  Clock2,
  Clock3,
  Clock4,
  Clock5,
  Clock6,
  Clock7,
  Clock8,
  Clock9,
} from '@lucide/vue'
import { useNow } from '@vueuse/core'
import { computed, type Component } from 'vue'

const clockIcons: Record<number, Component> = {
  0: Clock12,
  1: Clock1,
  2: Clock2,
  3: Clock3,
  4: Clock4,
  5: Clock5,
  6: Clock6,
  7: Clock7,
  8: Clock8,
  9: Clock9,
  10: Clock10,
  11: Clock11,
  12: Clock12,
}

const now = useNow()
const time = computed(() =>
  now.value.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }),
)
const icon = computed(() => {
  const hour = now.value.getHours() % 12
  return clockIcons[hour] ?? Clock
})
</script>

<template>
  <div
    class="absolute top-3 right-3 flex items-center gap-2 rounded-lg bg-black/50 px-4 py-2 text-base font-semibold text-white backdrop-blur-sm"
  >
    <component :is="icon" :size="20" class="shrink-0" />
    <span class="min-w-[5.5ch] text-center whitespace-nowrap tabular-nums">{{ time }}</span>
  </div>
</template>
