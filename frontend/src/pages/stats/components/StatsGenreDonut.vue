<script setup lang="ts">
import { Donut } from '@unovis/ts'
import { VisDonut, VisSingleContainer, VisTooltip } from '@unovis/vue'
import { computed } from 'vue'
import {
  GENRE_COLORS,
  GENRE_LABELS,
  GENRE_ORDER,
  toPercent,
} from '@/pages/stats/constants/stats-constants'
import type { GenreCountDTO } from '@/lib/api'

type GenreItem = GenreCountDTO & { label: string; color: string }

const props = defineProps<{ data: GenreCountDTO[] }>()

const items = computed<GenreItem[]>(() =>
  props.data
    .map((item) => ({
      ...item,
      label: GENRE_LABELS[item.genre],
      color: GENRE_COLORS[item.genre],
    }))
    .sort((a, b) => GENRE_ORDER.indexOf(a.genre) - GENRE_ORDER.indexOf(b.genre)),
)

const total = computed(() => items.value.reduce((sum, item) => sum + item.count, 0))

const value = (item: GenreItem) => item.count
const color = (item: GenreItem) => item.color

const triggers = {
  [Donut.selectors.segment]: (arc: { data: GenreItem }) => {
    const item = arc.data
    return `<div>${item.label}: <b>${item.count}</b> (${toPercent(item.count, total.value)})</div>`
  },
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <VisSingleContainer :data="items" :height="240">
      <VisDonut :value="value" :color="color" :arc-width="48" :pad-angle="0.02" />
      <VisTooltip :triggers="triggers" />
    </VisSingleContainer>

    <ul class="flex flex-wrap gap-x-4 gap-y-2">
      <li v-for="item in items" :key="item.genre" class="flex items-center gap-2 text-sm">
        <span class="size-3 shrink-0 rounded-full" :style="{ backgroundColor: item.color }" />
        <span>{{ item.label }}</span>
        <span class="text-muted-foreground">
          {{ item.count }} ({{ toPercent(item.count, total) }})
        </span>
      </li>
    </ul>
  </div>
</template>
