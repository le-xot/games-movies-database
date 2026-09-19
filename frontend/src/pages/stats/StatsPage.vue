<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import { useBadgeSelect } from '@/components/media/badge/composables/use-badge-select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RecordGenre, RecordGrade } from '@/lib/api'
import StatsGenreBreakdown from '@/pages/stats/components/StatsGenreBreakdown.vue'
import StatsGenreDonut from '@/pages/stats/components/StatsGenreDonut.vue'
import StatsStackedBar from '@/pages/stats/components/StatsStackedBar.vue'
import StatsSummaryCards from '@/pages/stats/components/StatsSummaryCards.vue'
import { useStats } from '@/pages/stats/composables/use-stats'
import {
  GENRE_LABELS,
  GENRE_ORDER,
  GRADE_COLORS,
  GRADE_ORDER,
  STATUS_COLORS,
  STATUS_ORDER,
} from '@/pages/stats/constants/stats-constants'
import type {
  BreakdownCategory,
  GenreBreakdownRow,
  StackedSegment,
} from '@/pages/stats/constants/stats-constants'

const { stats, isLoading, error } = storeToRefs(useStats())
const { statusTags, gradeTags } = useBadgeSelect()

const total = computed(() => stats.value?.total ?? 0)
const byStatus = computed(() => stats.value?.byStatus ?? [])
const byGenre = computed(() => stats.value?.byGenre ?? [])
const byGrade = computed(() => stats.value?.byGrade ?? [])

const gradeLabel = (grade: RecordGrade) =>
  `${gradeTags[grade].name} ${gradeTags[grade].label ?? ''}`.trim()

const statusSegments = computed<StackedSegment[]>(() =>
  STATUS_ORDER.map((status) => ({
    key: status,
    label: statusTags[status].name,
    color: STATUS_COLORS[status],
    count: byStatus.value.find((item) => item.status === status)?.count ?? 0,
  })).filter((segment) => segment.count > 0),
)

const gradeSegments = computed<StackedSegment[]>(() =>
  GRADE_ORDER.map((grade) => ({
    key: grade,
    label: gradeLabel(grade),
    color: GRADE_COLORS[grade],
    count: byGrade.value.find((item) => item.grade === grade)?.count ?? 0,
  })).filter((segment) => segment.count > 0),
)

const breakdownMode = ref<'grade' | 'status'>('grade')

const breakdownEntries = computed<{ genre: RecordGenre; key: string; count: number }[]>(() =>
  breakdownMode.value === 'grade'
    ? (stats.value?.byGenreGrade ?? []).map((item) => ({
        genre: item.genre,
        key: item.grade,
        count: item.count,
      }))
    : (stats.value?.byGenreStatus ?? []).map((item) => ({
        genre: item.genre,
        key: item.status,
        count: item.count,
      })),
)

const breakdownCategories = computed<BreakdownCategory[]>(() => {
  const categories: BreakdownCategory[] =
    breakdownMode.value === 'grade'
      ? GRADE_ORDER.map((grade) => ({
          key: grade,
          label: gradeLabel(grade),
          color: GRADE_COLORS[grade],
        }))
      : STATUS_ORDER.map((status) => ({
          key: status,
          label: statusTags[status].name,
          color: STATUS_COLORS[status],
        }))

  return categories.filter((category) =>
    breakdownEntries.value.some((entry) => entry.key === category.key && entry.count > 0),
  )
})

const breakdownRows = computed<GenreBreakdownRow[]>(() =>
  [...GENRE_ORDER].reverse().map((genre, index) => ({
    index,
    genre,
    label: GENRE_LABELS[genre],
    counts: breakdownCategories.value.map(
      (category) =>
        breakdownEntries.value.find((entry) => entry.genre === genre && entry.key === category.key)
          ?.count ?? 0,
    ),
  })),
)

const isEmpty = computed(() => !isLoading.value && !error.value && total.value === 0)
</script>

<template>
  <div class="flex flex-col gap-4">
    <template v-if="isLoading">
      <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card v-for="n in 4" :key="n" class="bg-[var(--n-action-color)]">
          <CardHeader class="pb-2">
            <div class="h-4 w-16 animate-pulse rounded bg-zinc-700" />
          </CardHeader>
          <CardContent>
            <div class="h-8 w-20 animate-pulse rounded bg-zinc-700" />
          </CardContent>
        </Card>
      </div>

      <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card v-for="n in 3" :key="n" class="bg-[var(--n-action-color)] lg:last:col-span-2">
          <CardHeader>
            <div class="h-5 w-32 animate-pulse rounded bg-zinc-700" />
          </CardHeader>
          <CardContent>
            <div class="h-[240px] animate-pulse rounded bg-zinc-700/40" />
          </CardContent>
        </Card>
      </div>
    </template>

    <div v-else-if="error" class="py-8 text-center text-destructive">{{ error }}</div>

    <div v-else-if="isEmpty" class="py-16 text-center text-muted-foreground">
      Пока нечего считать — в кладовке нет записей
    </div>

    <template v-else>
      <StatsSummaryCards :total="total" :by-status="byStatus" />

      <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card class="bg-[var(--n-action-color)]">
          <CardHeader>
            <CardTitle>По жанрам</CardTitle>
          </CardHeader>
          <CardContent>
            <StatsGenreDonut :data="byGenre" />
          </CardContent>
        </Card>

        <Card class="bg-[var(--n-action-color)]">
          <CardHeader>
            <CardTitle>Статусы и оценки</CardTitle>
          </CardHeader>
          <CardContent class="flex flex-col gap-6">
            <div class="flex flex-col gap-3">
              <h3 class="text-sm font-medium text-muted-foreground">Статусы</h3>
              <StatsStackedBar :segments="statusSegments" />
            </div>
            <div class="flex flex-col gap-3">
              <h3 class="text-sm font-medium text-muted-foreground">Оценки</h3>
              <StatsStackedBar :segments="gradeSegments" />
            </div>
          </CardContent>
        </Card>

        <Card class="bg-[var(--n-action-color)] lg:col-span-2">
          <CardHeader class="flex-row items-center justify-between">
            <CardTitle>Разрезы по жанрам</CardTitle>
            <Tabs v-model="breakdownMode">
              <TabsList>
                <TabsTrigger value="grade">Оценки</TabsTrigger>
                <TabsTrigger value="status">Статусы</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            <StatsGenreBreakdown :rows="breakdownRows" :categories="breakdownCategories" />
          </CardContent>
        </Card>
      </div>
    </template>
  </div>
</template>
