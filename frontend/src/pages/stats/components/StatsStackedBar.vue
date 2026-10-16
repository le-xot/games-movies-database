<script setup lang="ts">
import { computed } from 'vue'
import { toPercent } from '@/pages/stats/constants/stats-constants'
import type { StackedSegment } from '@/pages/stats/constants/stats-constants'

const props = defineProps<{ segments: StackedSegment[] }>()

const visible = computed(() => props.segments.filter((segment) => segment.count > 0))
const total = computed(() => visible.value.reduce((sum, segment) => sum + segment.count, 0))

function share(segment: StackedSegment): number {
  return total.value === 0 ? 0 : segment.count / total.value
}
</script>

<template>
  <div class="flex flex-col gap-3">
    <div v-if="visible.length" class="flex h-6 w-full overflow-hidden rounded-md bg-white/5">
      <div
        v-for="segment in visible"
        :key="segment.key"
        class="flex h-full items-center justify-center text-[11px] font-medium text-white/90"
        :style="{ width: `${share(segment) * 100}%`, backgroundColor: segment.color }"
        :title="`${segment.label}: ${segment.count} (${toPercent(segment.count, total)})`"
      >
        <span v-if="share(segment) >= 0.15" class="tabular-nums">{{ segment.count }}</span>
      </div>
    </div>
    <p v-else class="text-sm text-muted-foreground">Нет данных</p>

    <ul class="flex flex-wrap gap-2">
      <li
        v-for="segment in visible"
        :key="segment.key"
        class="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-xs"
      >
        <span class="size-2.5 shrink-0 rounded-full" :style="{ backgroundColor: segment.color }" />
        <span>{{ segment.label }}</span>
        <span class="tabular-nums text-muted-foreground">
          {{ segment.count }} ({{ toPercent(segment.count, total) }})
        </span>
      </li>
    </ul>
  </div>
</template>
