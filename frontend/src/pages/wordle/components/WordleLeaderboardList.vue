<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { WordleGameStatus } from '@/lib/api'
import { useUser } from '@/stores/use-user'
import type {
  WordleDailyLeaderboardEntryDTO,
  WordleLeaderboardDTO,
  WordleLeaderboardEntryDTO,
} from '@/lib/api'
import type { WordleLeaderboardMode } from '@/pages/wordle/constants/wordle-constants'

const props = defineProps<{
  leaderboard?: WordleLeaderboardDTO
  mode: WordleLeaderboardMode
  compact?: boolean
  limit?: number
}>()

const userStore = useUser()
const { currentUserId } = storeToRefs(userStore)

const dailyEntries = computed(() => {
  const list = props.leaderboard?.today?.entries ?? []
  return props.limit ? list.slice(0, props.limit) : list
})

const allTimeEntries = computed<WordleLeaderboardEntryDTO[]>(() => {
  const list = [...(props.leaderboard?.entries ?? [])]
  const sorted =
    props.mode === 'streak'
      ? list.sort(
          (a, b) =>
            b.currentStreak - a.currentStreak || b.wins - a.wins || a.login.localeCompare(b.login),
        )
      : list
  return props.limit ? sorted.slice(0, props.limit) : sorted
})

const subTextClass = computed(() => (props.compact ? 'text-[10px]' : 'text-xs'))
const rowPadding = computed(() => (props.compact ? 'py-1' : 'py-1.5'))
const listClass = computed(() => (props.compact ? '' : 'max-h-64 overflow-y-auto'))

function isCurrentUser(userId: string) {
  return userId === currentUserId.value
}

function dailyResult(entry: WordleDailyLeaderboardEntryDTO) {
  return entry.status === WordleGameStatus.WON ? `с ${entry.attempts}-й попытки` : 'не угадал'
}
</script>

<template>
  <ul
    v-if="mode === 'today' && dailyEntries.length > 0"
    class="flex flex-col gap-1"
    :class="listClass"
  >
    <li
      v-for="entry in dailyEntries"
      :key="entry.userId"
      class="flex items-center gap-2 rounded-lg px-2"
      :class="[rowPadding, { 'bg-secondary': isCurrentUser(entry.userId) }]"
    >
      <Avatar size="sm" shape="circle">
        <AvatarImage :src="entry.profileImageUrl" :alt="entry.login" />
        <AvatarFallback>{{ entry.login.slice(0, 1).toUpperCase() }}</AvatarFallback>
      </Avatar>
      <div class="min-w-0 flex-1">
        <p class="truncate text-sm font-medium">{{ entry.login }}</p>
        <p class="text-muted-foreground" :class="subTextClass">{{ dailyResult(entry) }}</p>
      </div>
      <span class="text-base font-bold">
        {{ entry.status === WordleGameStatus.WON ? entry.attempts : '—' }}
      </span>
    </li>
  </ul>

  <p v-else-if="mode === 'today'" class="text-xs text-muted-foreground">
    Сегодня ещё никто не сыграл
  </p>

  <ul v-else-if="allTimeEntries.length > 0" class="flex flex-col gap-1" :class="listClass">
    <li
      v-for="(entry, index) in allTimeEntries"
      :key="entry.userId"
      class="flex items-center gap-2 rounded-lg px-2"
      :class="rowPadding"
    >
      <span class="w-4 shrink-0 text-xs text-muted-foreground" :class="{ 'w-5 text-sm': !compact }">
        {{ index + 1 }}
      </span>
      <Avatar size="sm" shape="circle">
        <AvatarImage :src="entry.profileImageUrl" :alt="entry.login" />
        <AvatarFallback>{{ entry.login.slice(0, 1).toUpperCase() }}</AvatarFallback>
      </Avatar>
      <div class="min-w-0 flex-1">
        <p class="truncate text-sm font-medium">{{ entry.login }}</p>
        <p v-if="entry.wins > 0" class="text-muted-foreground" :class="subTextClass">
          в среднем {{ entry.avgAttempts }} попыток
        </p>
        <p v-else class="text-muted-foreground" :class="subTextClass">побед пока нет</p>
      </div>
      <span class="font-bold" :class="compact ? 'text-base' : 'text-lg'">
        {{ mode === 'streak' ? entry.currentStreak : entry.wins }}
      </span>
    </li>
  </ul>

  <p v-else class="text-sm text-muted-foreground">Пока никто не сыграл</p>
</template>
