<script setup lang="ts">
import { StackedBar } from '@unovis/ts'
import { VisAxis, VisStackedBar, VisTooltip, VisXYContainer } from '@unovis/vue'
import { computed } from 'vue'
import { toPercent } from '@/pages/stats/constants/stats-constants'
import type { BreakdownCategory, GenreBreakdownRow } from '@/pages/stats/constants/stats-constants'

const props = defineProps<{
  rows: GenreBreakdownRow[]
  categories: BreakdownCategory[]
}>()

const x = (row: GenreBreakdownRow) => row.index
const y = computed(() =>
  props.categories.map(
    (_, categoryIndex) => (row: GenreBreakdownRow) => row.counts[categoryIndex] ?? 0,
  ),
)
const color = (_row: GenreBreakdownRow, categoryIndex: number) =>
  props.categories[categoryIndex]?.color ?? '#333333'

const tickValues = computed(() => props.rows.map((row) => row.index))
const tickFormat = (index: number) => props.rows.find((row) => row.index === index)?.label ?? ''

const grandTotal = computed(() =>
  props.rows.reduce((sum, row) => sum + row.counts.reduce((rowSum, count) => rowSum + count, 0), 0),
)
const categoryTotals = computed(() =>
  props.categories.map((_, categoryIndex) =>
    props.rows.reduce((sum, row) => sum + (row.counts[categoryIndex] ?? 0), 0),
  ),
)
const rowTotals = computed(() =>
  props.rows.map((row) => row.counts.reduce((sum, count) => sum + count, 0)),
)

interface BarDatum {
  datum: GenreBreakdownRow
  index: number
  stackIndex: number
}

const triggers = {
  [StackedBar.selectors.bar]: (bar: BarDatum) => {
    const row = bar?.datum
    const category = props.categories[bar?.stackIndex]
    if (!row || !category) return ''
    const count = row.counts[bar.stackIndex] ?? 0
    const rowTotal = rowTotals.value[bar.index] ?? 0
    return `<div>${row.label} · ${category.label}: <b>${count}</b> (${toPercent(count, rowTotal)})</div>`
  },
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <VisXYContainer :data="rows" :height="260">
      <VisStackedBar
        :x="x"
        :y="y"
        :color="color"
        orientation="horizontal"
        :bar-width="28"
        :bar-min-height1-px="true"
        :bar-min-height-zero-value="0"
        :duration="0"
      />
      <VisAxis
        type="y"
        :tick-values="tickValues"
        :tick-format="tickFormat"
        :grid-line="false"
        :tick-size="0"
        :domain-line="false"
        :duration="0"
      />
      <VisTooltip :triggers="triggers" />
    </VisXYContainer>

    <ul class="flex flex-wrap gap-x-4 gap-y-2">
      <li
        v-for="(category, categoryIndex) in categories"
        :key="category.key"
        class="flex items-center gap-2 text-sm"
      >
        <span class="size-3 shrink-0 rounded-full" :style="{ backgroundColor: category.color }" />
        <span>{{ category.label }}</span>
        <span class="text-muted-foreground">
          {{ categoryTotals[categoryIndex] }}
          ({{ toPercent(categoryTotals[categoryIndex], grandTotal) }})
        </span>
      </li>
    </ul>
  </div>
</template>
