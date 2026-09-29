<script setup lang="ts">
import { Puzzle } from '@lucide/vue'
import { useQuery } from '@pinia/colada'
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { WORDLE_LEADERBOARD_KEY } from '@/composables/query-keys'
import WordleLeaderboardList from '@/pages/wordle/components/WordleLeaderboardList.vue'
import { formatWordleGlobalStats } from '@/pages/wordle/constants/wordle-constants'
import { useApi } from '@/stores/use-api'
import { useLoginDialog } from '@/stores/use-login-dialog'
import type { WordleLeaderboardMode } from '@/pages/wordle/constants/wordle-constants'

const api = useApi()
const loginDialog = useLoginDialog()
const mode = ref<WordleLeaderboardMode>('today')

const {
  data: leaderboard,
  error,
  isPending,
} = useQuery({
  key: [WORDLE_LEADERBOARD_KEY],
  query: async () => (await api.wordle.wordleControllerGetLeaderboard()).data,
  gcTime: false,
})
</script>

<template>
  <div
    class="flex min-h-[calc(100dvh-132px)] flex-col items-center justify-center gap-8 px-4 py-8 xl:min-h-[calc(100dvh-64px)]"
  >
    <div class="flex max-w-md flex-col items-center gap-4 text-center">
      <span class="flex size-16 items-center justify-center rounded-full bg-secondary">
        <Puzzle class="size-8 text-muted-foreground" />
      </span>
      <div class="flex flex-col gap-1">
        <h1 class="text-xl font-bold">Вордли</h1>
        <p class="text-sm text-muted-foreground">Угадайте слово дня и попадите в таблицу лидеров</p>
      </div>
      <Button
        class="h-auto whitespace-normal px-4 py-2 text-center"
        @click="loginDialog.openLogin()"
      >
        Войдите в аккаунт, чтобы сыграть в Вордли
      </Button>
    </div>

    <div class="w-full max-w-md rounded-lg border border-border p-4">
      <div class="mb-2 flex items-center justify-between gap-2">
        <h2 class="text-xs font-medium uppercase text-muted-foreground">Лидеры</h2>
        <Tabs v-model="mode">
          <TabsList>
            <TabsTrigger value="today">Сегодня</TabsTrigger>
            <TabsTrigger value="wins">Победы</TabsTrigger>
            <TabsTrigger value="streak">Серия</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <p v-if="isPending" class="text-xs text-muted-foreground">Загрузка…</p>
      <p v-else-if="error" class="text-xs text-muted-foreground">Не удалось загрузить лидеров</p>
      <template v-else>
        <WordleLeaderboardList :leaderboard="leaderboard" :mode="mode" compact :limit="5" />
        <p class="mt-2 text-xs text-muted-foreground">
          {{ formatWordleGlobalStats(leaderboard) }}
        </p>
      </template>
    </div>
  </div>
</template>
