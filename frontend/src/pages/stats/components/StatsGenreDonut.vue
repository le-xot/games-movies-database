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
import { pluralRu } from '@/utils/plural-ru'
import type { GenreCountDTO } from '@/lib/api'

type GenreItem = GenreCountDTO & { label: string; color: string }

const props = defineProps<{
  data: GenreCountDTO[]
  unit: readonly [string, string, string]
}>()

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
    <template v-if="items.length">
      <div class="relative">
        <VisSingleContainer :data="items" :height="240">
          <VisDonut :value="value" :color="color" :arc-width="48" :pad-angle="0.02" />
          <VisTooltip :triggers="triggers" />
        </VisSingleContainer>
        <div class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span class="text-2xl font-semibold tabular-nums">{{ total }}</span>
          <span class="text-xs text-muted-foreground">{{ pluralRu(total, unit) }}</span>
        </div>
      </div>

      <ul class="flex flex-wrap gap-2">
        <li
          v-for="item in items"
          :key="item.genre"
          class="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-xs"
        >
          <span class="size-2.5 shrink-0 rounded-full" :style="{ backgroundColor: item.color }" />
          <span>{{ item.label }}</span>
          <span class="tabular-nums text-muted-foreground">
            {{ item.count }} ({{ toPercent(item.count, total) }})
          </span>
        </li>
      </ul>
    </template>

    <p v-else class="py-8 text-center text-sm text-muted-foreground">Нет данных</p>
  </div>
</template>
