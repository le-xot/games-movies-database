<script setup lang="ts">
import { computed } from 'vue'
import { toPercent } from '@/pages/stats/constants/stats-constants'
import type { BreakdownCategory, GenreBreakdownRow } from '@/pages/stats/constants/stats-constants'

const props = defineProps<{
  rows: GenreBreakdownRow[]
  categories: BreakdownCategory[]
}>()

interface RowSegment {
  key: string
  label: string
  color: string
  count: number
  share: number
}

const rowTotal = (row: GenreBreakdownRow) => row.counts.reduce((sum, count) => sum + count, 0)

function segmentsFor(row: GenreBreakdownRow): RowSegment[] {
  const total = rowTotal(row)
  if (total === 0) return []
  return props.categories.flatMap((category, index) => {
    const count = row.counts[index] ?? 0
    if (count === 0) return []
    return [
      {
        key: category.key,
        label: category.label,
        color: category.color,
        count,
        share: count / total,
      },
    ]
  })
}

const grandTotal = computed(() =>
  props.rows.reduce((sum, row) => sum + row.counts.reduce((rowSum, count) => rowSum + count, 0), 0),
)
const categoryTotals = computed(() =>
  props.categories.map((_, categoryIndex) =>
    props.rows.reduce((sum, row) => sum + (row.counts[categoryIndex] ?? 0), 0),
  ),
)
</script>

<template>
  <div class="flex flex-col gap-4">
    <div v-if="rows.length" class="flex flex-col gap-2.5">
      <div v-for="row in rows" :key="row.genre" class="flex items-center gap-3">
        <span class="w-24 shrink-0 text-right text-xs text-muted-foreground">{{ row.label }}</span>
        <div class="flex h-6 flex-1 overflow-hidden rounded-md bg-white/5">
          <div
            v-for="segment in segmentsFor(row)"
            :key="segment.key"
            class="flex h-full items-center justify-center text-[11px] font-medium text-white/90"
            :style="{ width: `${segment.share * 100}%`, backgroundColor: segment.color }"
            :title="`${row.label} · ${segment.label}: ${segment.count} (${toPercent(segment.count, rowTotal(row))})`"
          >
            <span v-if="segment.share >= 0.12" class="tabular-nums">{{ segment.count }}</span>
          </div>
        </div>
        <span class="w-8 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
          {{ rowTotal(row) }}
        </span>
      </div>
    </div>

    <p v-else class="py-8 text-center text-sm text-muted-foreground">Нет данных</p>

    <ul v-if="rows.length" class="flex flex-wrap gap-2">
      <li
        v-for="(category, categoryIndex) in categories"
        :key="category.key"
        class="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-xs"
      >
        <span class="size-2.5 shrink-0 rounded-full" :style="{ backgroundColor: category.color }" />
        <span>{{ category.label }}</span>
        <span class="tabular-nums text-muted-foreground">
          {{ categoryTotals[categoryIndex] }}
          ({{ toPercent(categoryTotals[categoryIndex], grandTotal) }})
        </span>
      </li>
    </ul>
  </div>
</template>
