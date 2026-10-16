<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useBadgeSelect } from '@/components/media/badge/composables/use-badge-select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { useCommunity } from '@/pages/community/composables/use-community'
import { COMMUNITY_GRADE_ORDER, type CommunityCounts } from '@/utils/community-rating'
import type { CommunityMemberEntity, RecordGrade } from '@/lib/api'

const router = useRouter()
const community = useCommunity()
const { items, isLoading } = storeToRefs(community)
const { gradeTags } = useBadgeSelect()

function countsOf(member: CommunityMemberEntity): CommunityCounts {
  return member.counts as CommunityCounts
}

function gradeLabel(grade: RecordGrade): string {
  return `${gradeTags[grade].name} ${gradeTags[grade].label ?? ''}`.trim()
}

function openRatings(member: CommunityMemberEntity) {
  void router.push({ name: 'user-ratings', params: { id: member.userId } })
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <h1 class="text-xl font-semibold">
      Комьюнити <span class="text-muted-foreground">· {{ items.length }}</span>
    </h1>

    <div v-if="isLoading" class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Card v-for="n in 6" :key="n" class="bg-[var(--n-action-color)]">
        <CardContent class="flex items-center gap-3 p-4">
          <div class="size-10 animate-pulse rounded-full bg-zinc-700" />
          <div class="flex flex-1 flex-col gap-2">
            <div class="h-4 w-1/2 animate-pulse rounded bg-zinc-700" />
            <div class="h-3 w-3/4 animate-pulse rounded bg-zinc-700" />
          </div>
        </CardContent>
      </Card>
    </div>

    <div v-else-if="items.length === 0" class="py-16 text-center text-muted-foreground">
      Пока никто не голосовал — стань первым
    </div>

    <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Card
        v-for="member in items"
        :key="member.userId"
        class="cursor-pointer bg-[var(--n-action-color)] transition-opacity hover:opacity-90"
        @click="openRatings(member)"
      >
        <CardContent class="flex items-center gap-3 p-4">
          <Avatar class="size-10 shrink-0">
            <AvatarImage :src="member.profileImageUrl" :alt="member.login" />
            <AvatarFallback>{{ member.login.charAt(0).toUpperCase() }}</AvatarFallback>
          </Avatar>
          <div class="flex min-w-0 flex-1 flex-col gap-1">
            <span class="truncate text-sm font-medium">{{ member.login }}</span>
            <span class="text-xs text-muted-foreground">оценок: {{ member.total }}</span>
            <div class="flex flex-wrap gap-x-3 gap-y-1">
              <span
                v-for="grade in COMMUNITY_GRADE_ORDER"
                :key="grade"
                v-show="countsOf(member)[grade] > 0"
                class="text-sm"
                :title="gradeLabel(grade)"
              >
                {{ gradeTags[grade].name }}
                <span class="text-xs tabular-nums text-muted-foreground">{{
                  countsOf(member)[grade]
                }}</span>
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
