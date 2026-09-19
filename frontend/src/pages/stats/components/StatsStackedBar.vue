<script setup lang="ts">
import { StackedBar } from '@unovis/ts'
import { VisStackedBar, VisTooltip, VisXYContainer } from '@unovis/vue'
import { computed } from 'vue'
import { toPercent } from '@/pages/stats/constants/stats-constants'
import type { StackedSegment } from '@/pages/stats/constants/stats-constants'

type Row = Partial<Record<string, number>>

const props = defineProps<{ segments: StackedSegment[] }>()

const visible = computed(() => props.segments.filter((segment) => segment.count > 0))
const total = computed(() => visible.value.reduce((sum, segment) => sum + segment.count, 0))

const barData = computed<Row[]>(() => {
  const row: Row = {}
  for (const segment of visible.value) row[segment.key] = segment.count
  return [row]
})

const x = (_row: Row, index: number) => index
const y = computed(() => visible.value.map((segment) => (row: Row) => row[segment.key] ?? 0))
const color = (_row: Row, index: number) => visible.value[index]?.color ?? '#333333'

const triggers = {
  [StackedBar.selectors.bar]: (_row: Row, index: number) => {
    const segment = visible.value[index]
    if (!segment) return ''
    return `<div>${segment.label}: <b>${segment.count}</b> (${toPercent(segment.count, total.value)})</div>`
  },
}
</script>

<template>
  <div class="flex flex-col gap-3">
    <VisXYContainer v-if="visible.length" :data="barData" :height="56">
      <VisStackedBar :x="x" :y="y" :color="color" orientation="horizontal" :bar-width="40" />
      <VisTooltip :triggers="triggers" />
    </VisXYContainer>
    <p v-else class="text-sm text-muted-foreground">Нет данных</p>

    <ul class="flex flex-wrap gap-x-4 gap-y-2">
      <li v-for="segment in visible" :key="segment.key" class="flex items-center gap-2 text-sm">
        <span class="size-3 shrink-0 rounded-full" :style="{ backgroundColor: segment.color }" />
        <span>{{ segment.label }}</span>
        <span class="text-muted-foreground">
          {{ segment.count }} ({{ toPercent(segment.count, total) }})
        </span>
      </li>
    </ul>
  </div>
</template>
