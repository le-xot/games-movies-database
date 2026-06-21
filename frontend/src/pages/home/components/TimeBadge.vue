<script setup lang="ts">
import { Clock } from '@lucide/vue'
import { useNow } from '@vueuse/core'
import { computed } from 'vue'

const now = useNow()
const time = computed(() =>
  now.value.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }),
)
</script>

<template>
  <div
    class="absolute top-3 right-3 flex items-center gap-2 rounded-lg bg-black/50 px-4 py-2 text-base font-semibold text-white backdrop-blur-sm"
  >
    <Clock :size="20" class="shrink-0" />
    <span class="min-w-[5.5ch] text-center whitespace-nowrap tabular-nums">{{ time }}</span>
  </div>
</template>
