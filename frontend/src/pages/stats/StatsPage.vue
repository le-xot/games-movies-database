<script setup lang="ts">
import { RotateCw } from '@lucide/vue'
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import { useBadgeSelect } from '@/components/media/badge/composables/use-badge-select'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RecordGrade } from '@/lib/api'
import StatsGenreBreakdown from '@/pages/stats/components/StatsGenreBreakdown.vue'
import StatsGenreDonut from '@/pages/stats/components/StatsGenreDonut.vue'
import StatsStackedBar from '@/pages/stats/components/StatsStackedBar.vue'
import StatsSummaryCards from '@/pages/stats/components/StatsSummaryCards.vue'
import { useStats } from '@/pages/stats/composables/use-stats'
import {
  GRADE_COLORS,
  GRADE_ORDER,
  STATUS_COLORS,
  STATUS_ORDER,
} from '@/pages/stats/constants/stats-constants'
import {
  buildBreakdownRows,
  sumCounts,
  sumCountsByGenre,
  type BreakdownEntry,
} from '@/pages/stats/stats-aggregates'
import type { BreakdownCategory, StackedSegment } from '@/pages/stats/constants/stats-constants'

const RECORD_FORMS = ['запись', 'записи', 'записей'] as const
const VOTE_FORMS = ['голос', 'голоса', 'голосов'] as const

const statsStore = useStats()
const { stats, isLoading, error } = storeToRefs(statsStore)
const { statusTags, gradeTags } = useBadgeSelect()

const total = computed(() => stats.value?.total ?? 0)
const byStatus = computed(() => stats.value?.byStatus ?? [])
const byGenre = computed(() => stats.value?.byGenre ?? [])
const byGrade = computed(() => stats.value?.byGrade ?? [])
const byFriendsGrade = computed(() => stats.value?.byFriendsGrade ?? [])
const friendsVotes = computed(() => sumCounts(byFriendsGrade.value))
const friendsGenres = computed(() =>
  sumCountsByGenre(
    (stats.value?.byFriendsGenreGrade ?? []).map((item) => ({
      genre: item.genre,
      count: item.count,
    })),
  ),
)

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

const friendsGradeSegments = computed<StackedSegment[]>(() =>
  GRADE_ORDER.map((grade) => ({
    key: grade,
    label: gradeLabel(grade),
    color: GRADE_COLORS[grade],
    count: byFriendsGrade.value.find((item) => item.grade === grade)?.count ?? 0,
  })).filter((segment) => segment.count > 0),
)

const breakdownMode = ref<'friends' | 'grade' | 'status'>('grade')

const breakdownEntries = computed<BreakdownEntry[]>(() => {
  if (breakdownMode.value === 'status') {
    return (stats.value?.byGenreStatus ?? []).map((item) => ({
      genre: item.genre,
      key: item.status,
      count: item.count,
    }))
  }
  if (breakdownMode.value === 'friends') {
    return (stats.value?.byFriendsGenreGrade ?? []).map((item) => ({
      genre: item.genre,
      key: item.grade,
      count: item.count,
    }))
  }
  return (stats.value?.byGenreGrade ?? []).map((item) => ({
    genre: item.genre,
    key: item.grade,
    count: item.count,
  }))
})

const breakdownCategories = computed<BreakdownCategory[]>(() => {
  const categories: BreakdownCategory[] =
    breakdownMode.value === 'status'
      ? STATUS_ORDER.map((status) => ({
          key: status,
          label: statusTags[status].name,
          color: STATUS_COLORS[status],
        }))
      : GRADE_ORDER.map((grade) => ({
          key: grade,
          label: gradeLabel(grade),
          color: GRADE_COLORS[grade],
        }))

  return categories.filter((category) =>
    breakdownEntries.value.some((entry) => entry.key === category.key && entry.count > 0),
  )
})

const breakdownRows = computed(() =>
  buildBreakdownRows(breakdownEntries.value, breakdownCategories.value),
)

const isEmpty = computed(() => !isLoading.value && !error.value && total.value === 0)
</script>

<template>
  <div class="flex flex-col gap-4">
    <template v-if="isLoading">
      <div class="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Card v-for="n in 5" :key="n" class="bg-[var(--n-action-color)]">
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

    <div v-else-if="error" class="flex flex-col items-center gap-3 py-8 text-center">
      <p class="text-sm text-destructive">{{ error }}</p>
      <Button variant="outline" size="sm" @click="statsStore.refetch()">
        <RotateCw class="size-4" />
        Повторить
      </Button>
    </div>

    <div v-else-if="isEmpty" class="py-16 text-center text-muted-foreground">
      Пока нечего считать — в кладовке нет записей
    </div>

    <template v-else>
      <StatsSummaryCards :total="total" :by-status="byStatus" :friends-votes="friendsVotes" />

      <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card class="bg-[var(--n-action-color)]">
          <CardHeader>
            <CardTitle>По жанрам</CardTitle>
            <CardDescription>Мои записи и голоса друзей</CardDescription>
          </CardHeader>
          <CardContent class="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div class="flex min-w-0 flex-col gap-3">
              <h3 class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Мои</h3>
              <StatsGenreDonut :data="byGenre" :unit="RECORD_FORMS" />
            </div>
            <div class="flex min-w-0 flex-col gap-3">
              <h3 class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Друзья
              </h3>
              <StatsGenreDonut :data="friendsGenres" :unit="VOTE_FORMS" />
            </div>
          </CardContent>
        </Card>

        <Card class="bg-[var(--n-action-color)]">
          <CardHeader>
            <CardTitle>Статусы и оценки</CardTitle>
            <CardDescription>Прогресс коллекции и распределение оценок</CardDescription>
          </CardHeader>
          <CardContent class="flex flex-col gap-6">
            <div class="flex flex-col gap-3">
              <h3 class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Статусы
              </h3>
              <StatsStackedBar :segments="statusSegments" />
            </div>
            <div class="flex flex-col gap-3">
              <h3 class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Мои оценки
              </h3>
              <StatsStackedBar :segments="gradeSegments" />
            </div>
            <div class="flex flex-col gap-3">
              <h3 class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Оценки друзей
              </h3>
              <StatsStackedBar :segments="friendsGradeSegments" />
            </div>
          </CardContent>
        </Card>

        <Card class="bg-[var(--n-action-color)] lg:col-span-2">
          <CardHeader
            class="flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div class="flex flex-col gap-1.5">
              <CardTitle>Разрезы по жанрам</CardTitle>
              <CardDescription>Как распределены оценки и статусы внутри жанров</CardDescription>
            </div>
            <Tabs v-model="breakdownMode">
              <TabsList>
                <TabsTrigger value="grade">Оценки</TabsTrigger>
                <TabsTrigger value="status">Статусы</TabsTrigger>
                <TabsTrigger value="friends">Друзья</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            <StatsGenreBreakdown :rows="breakdownRows" :categories="breakdownCategories" />
          </CardContent>
        </Card>
      </div>

      <p class="text-xs text-muted-foreground">
        Оценки друзей считаются без записей «Не интересно» и советов.
      </p>
    </template>
  </div>
</template>
