<script setup lang="ts">
import { RotateCw, Search } from '@lucide/vue'
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useBadgeSelect } from '@/components/media/badge/composables/use-badge-select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  activityRanks,
  countsOf,
  filterMembers,
  proportionSegments,
  sortMembers,
  type CommunitySort,
} from '@/pages/community/community-members'
import { useCommunity } from '@/pages/community/composables/use-community'
import { GRADE_COLORS } from '@/pages/stats/constants/stats-constants'
import { useTitle } from '@/stores/use-title'
import { useUser } from '@/stores/use-user'
import { getTopGrade } from '@/utils/community-rating'
import { pluralRu } from '@/utils/plural-ru'
import type { CommunityMemberEntity } from '@/lib/api'

const NEUTRAL_COLOR = '#333333'
const PARTICIPANT_FORMS = ['участник', 'участника', 'участников'] as const
const RATING_FORMS = ['оценка', 'оценки', 'оценок'] as const

const { updateTitle } = useTitle()
updateTitle('Комьюнити')

const community = useCommunity()
const { items, isLoading, error } = storeToRefs(community)
const { currentUserId } = storeToRefs(useUser())
const { gradeTags } = useBadgeSelect()

const query = ref('')
const sort = ref<CommunitySort>('activity')

const ranks = computed(() => activityRanks(items.value))
const visible = computed(() => sortMembers(filterMembers(items.value, query.value), sort.value))

const participantsLabel = computed(() => {
  if (isLoading.value || error.value) return ''
  const count = items.value.length
  return `${count} ${pluralRu(count, PARTICIPANT_FORMS)}`
})

function favoriteColor(member: CommunityMemberEntity): string {
  const grade = getTopGrade(countsOf(member))
  return grade ? GRADE_COLORS[grade] : NEUTRAL_COLOR
}

function rankOf(member: CommunityMemberEntity): number | null {
  if (sort.value !== 'activity') return null
  const rank = ranks.value.get(member.userId)
  return rank !== undefined && rank <= 3 ? rank : null
}

function ratingsLabel(total: number): string {
  return `${total} ${pluralRu(total, RATING_FORMS)}`
}

function isSelf(member: CommunityMemberEntity): boolean {
  return currentUserId.value === member.userId
}

function retry() {
  void community.refetch()
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <header class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div class="flex flex-col gap-1">
        <h1 class="text-2xl font-semibold tracking-tight">Комьюнити</h1>
        <p class="text-sm text-muted-foreground">{{ participantsLabel }}</p>
      </div>

      <div v-if="items.length" class="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div class="relative">
          <Search
            class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            v-model="query"
            type="search"
            placeholder="Найти по логину"
            aria-label="Найти по логину"
            class="pl-9 sm:w-56"
          />
        </div>
        <div
          class="inline-flex self-start rounded-md border p-0.5"
          role="group"
          aria-label="Сортировка"
        >
          <Button
            size="sm"
            :variant="sort === 'activity' ? 'secondary' : 'ghost'"
            :aria-pressed="sort === 'activity'"
            @click="sort = 'activity'"
          >
            По активности
          </Button>
          <Button
            size="sm"
            :variant="sort === 'name' ? 'secondary' : 'ghost'"
            :aria-pressed="sort === 'name'"
            @click="sort = 'name'"
          >
            По имени
          </Button>
        </div>
      </div>
    </header>

    <div v-if="error" class="flex flex-col items-center gap-3 py-16 text-center">
      <p class="text-sm text-destructive">{{ error }}</p>
      <Button variant="outline" size="sm" @click="retry">
        <RotateCw />
        Повторить
      </Button>
    </div>

    <ul v-else-if="isLoading" class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <li
        v-for="n in 6"
        :key="n"
        class="flex h-44 animate-pulse flex-col gap-5 rounded-xl border border-white/10 bg-[var(--n-action-color)] p-5"
      >
        <div class="flex items-center gap-4">
          <div class="size-16 shrink-0 rounded-full bg-zinc-700" />
          <div class="flex flex-1 flex-col gap-2">
            <div class="h-4 w-1/2 rounded bg-zinc-700" />
            <div class="h-3 w-1/3 rounded bg-zinc-700" />
          </div>
        </div>
        <div class="mt-auto h-2 w-full rounded-full bg-zinc-700" />
      </li>
    </ul>

    <div v-else-if="items.length === 0" class="py-16 text-center text-muted-foreground">
      Пока никто не голосовал — стань первым
    </div>

    <div v-else-if="visible.length === 0" class="py-16 text-center text-muted-foreground">
      Никого не нашли по запросу «{{ query }}»
    </div>

    <ul v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <li v-for="member in visible" :key="member.userId" class="flex">
        <RouterLink
          :to="{ name: 'user-ratings', params: { id: member.userId } }"
          class="group relative flex w-full flex-col gap-5 overflow-hidden rounded-xl border bg-[var(--n-action-color)] p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          :class="isSelf(member) ? 'border-white/40' : 'border-white/10'"
          :style="{
            backgroundImage: `linear-gradient(160deg, ${favoriteColor(member)}55 0%, transparent 60%)`,
          }"
        >
          <span
            v-if="rankOf(member)"
            class="absolute right-4 top-4 rounded-full border px-2 py-0.5 text-xs font-semibold tabular-nums"
            :class="
              rankOf(member) === 1
                ? 'border-amber-400/50 bg-amber-400/15 text-amber-300'
                : 'border-white/15 text-muted-foreground'
            "
          >
            #{{ rankOf(member) }}
          </span>

          <div class="flex items-center gap-4">
            <Avatar
              class="size-16 shrink-0 border-2"
              :style="{ borderColor: favoriteColor(member) }"
            >
              <AvatarImage :src="member.profileImageUrl" :alt="member.login" />
              <AvatarFallback class="text-lg font-semibold">
                {{ member.login.charAt(0).toUpperCase() }}
              </AvatarFallback>
            </Avatar>
            <div class="flex min-w-0 flex-col gap-1">
              <div class="flex items-center gap-2">
                <span class="truncate text-lg font-semibold">{{ member.login }}</span>
                <span
                  v-if="isSelf(member)"
                  class="shrink-0 rounded bg-white/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wider"
                >
                  ты
                </span>
              </div>
              <span class="text-sm text-muted-foreground">{{ ratingsLabel(member.total) }}</span>
            </div>
          </div>

          <div class="mt-auto flex flex-col gap-3">
            <div class="flex h-2 w-full overflow-hidden rounded-full bg-white/10">
              <span
                v-for="segment in proportionSegments(countsOf(member))"
                :key="segment.grade"
                class="h-full"
                :style="{
                  width: `${segment.share * 100}%`,
                  backgroundColor: GRADE_COLORS[segment.grade],
                }"
              />
            </div>
            <div class="flex flex-wrap gap-1.5">
              <span
                v-for="segment in proportionSegments(countsOf(member))"
                :key="segment.grade"
                class="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/20 px-2 py-0.5 text-xs tabular-nums"
                :title="gradeTags[segment.grade].label"
              >
                {{ gradeTags[segment.grade].name }} {{ segment.count }}
              </span>
            </div>
          </div>
        </RouterLink>
      </li>
    </ul>
  </div>
</template>
