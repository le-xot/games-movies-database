<script setup lang="ts">
import { StackedBar } from '@unovis/ts'
import { VisAxis, VisStackedBar, VisTooltip, VisXYContainer } from '@unovis/vue'
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogScrollContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import WordleLeaderboardList from '@/pages/wordle/components/WordleLeaderboardList.vue'
import { useWordle } from '@/pages/wordle/composables/use-wordle'
import { useWordleSettings } from '@/pages/wordle/composables/use-wordle-settings'
import type { WordleLeaderboardMode } from '@/pages/wordle/constants/wordle-constants'

defineProps<{ open: boolean }>()
const emit = defineEmits<{ 'update:open': [value: boolean] }>()

const wordle = useWordle()
const { stats, leaderboard } = storeToRefs(wordle)
const { isColorblind, setColorblind } = useWordleSettings()
const mode = ref<WordleLeaderboardMode>('today')

const summary = computed(() => [
  { label: 'Играно', value: stats.value?.played ?? 0 },
  { label: 'Победы', value: stats.value?.wins ?? 0 },
  { label: 'Побед, %', value: stats.value?.winRate ?? 0 },
  {
    label: 'Серия',
    value: stats.value?.currentStreak ?? 0,
    hint: `макс. ${stats.value?.maxStreak ?? 0}`,
  },
])

interface DistributionDatum {
  attempts: number
  count: number
}

const distributionData = computed<DistributionDatum[]>(() =>
  (stats.value?.distribution ?? []).map((count, index) => ({ attempts: index + 1, count })),
)
const distX = (datum: DistributionDatum) => datum.attempts
const distY = (datum: DistributionDatum) => datum.count
const distColor = () => '#16a34a'
const distributionTotal = computed(() =>
  distributionData.value.reduce((sum, datum) => sum + datum.count, 0),
)

const distributionTriggers = {
  [StackedBar.selectors.bar]: (datum: DistributionDatum) =>
    `<div>${datum.attempts} попыток: <b>${datum.count}</b></div>`,
}

const distributionTickValues = [1, 2, 3, 4, 5, 6]
const distributionTickFormat = (value: number) => String(value)

const globalStats = computed(() => [
  { label: 'Игроков', value: leaderboard.value?.totalPlayers ?? 0 },
  { label: 'Игр', value: leaderboard.value?.totalGames ?? 0 },
  { label: 'Побед сегодня', value: leaderboard.value?.winsToday ?? 0 },
])
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogScrollContent class="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>Статистика</DialogTitle>
        <DialogDescription class="sr-only"> Личная статистика и таблица лидеров </DialogDescription>
      </DialogHeader>

      <div class="grid grid-cols-4 gap-2">
        <Card v-for="item in summary" :key="item.label" class="bg-[var(--n-action-color)]">
          <CardContent class="flex flex-col items-center px-2 py-3">
            <span class="text-2xl font-bold">{{ item.value }}</span>
            <span class="text-center text-xs text-muted-foreground">{{ item.label }}</span>
            <span v-if="item.hint" class="text-[10px] text-muted-foreground">
              {{ item.hint }}
            </span>
          </CardContent>
        </Card>
      </div>

      <div
        class="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2"
      >
        <div>
          <p class="text-sm font-medium">Режим для дальтоников</p>
          <p class="text-xs text-muted-foreground">
            Синий вместо зелёного, оранжевый вместо жёлтого
          </p>
        </div>
        <Switch
          :model-value="isColorblind"
          aria-label="Режим для дальтоников"
          @update:model-value="setColorblind"
        />
      </div>

      <div>
        <h3 class="mb-2 text-sm font-medium text-muted-foreground">Распределение попыток</h3>
        <VisXYContainer v-if="distributionTotal > 0" :data="distributionData" :height="160">
          <VisStackedBar :x="distX" :y="distY" :color="distColor" :bar-width="28" />
          <VisAxis
            type="x"
            :tick-values="distributionTickValues"
            :tick-format="distributionTickFormat"
            :grid-line="false"
            :domain-line="false"
          />
          <VisTooltip :triggers="distributionTriggers" />
        </VisXYContainer>
        <p v-else class="text-sm text-muted-foreground">Пока нет победных партий</p>
      </div>

      <div>
        <div class="mb-2 flex items-center justify-between gap-2">
          <h3 class="text-sm font-medium text-muted-foreground">Лидеры</h3>
          <Tabs v-model="mode">
            <TabsList>
              <TabsTrigger value="today">Сегодня</TabsTrigger>
              <TabsTrigger value="wins">Победы</TabsTrigger>
              <TabsTrigger value="streak">Серия</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div class="mb-3 grid grid-cols-3 gap-2">
          <Card v-for="item in globalStats" :key="item.label" class="bg-[var(--n-action-color)]">
            <CardContent class="flex flex-col items-center px-2 py-2">
              <span class="text-lg font-bold">{{ item.value }}</span>
              <span class="text-center text-xs text-muted-foreground">{{ item.label }}</span>
            </CardContent>
          </Card>
        </div>

        <WordleLeaderboardList :leaderboard="leaderboard" :mode="mode" />
      </div>
    </DialogScrollContent>
  </Dialog>
</template>
