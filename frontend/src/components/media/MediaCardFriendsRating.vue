<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import { toast } from 'vue-sonner'
import { useBadgeSelect } from '@/components/media/badge/composables/use-badge-select'
import { useRating } from '@/composables/use-rating'
import { RecordGrade } from '@/lib/api'
import { GRADE_BUTTON_ORDER, GRADE_VOCABULARY } from '@/lib/record-vocabulary'
import { useLoginDialog } from '@/stores/use-login-dialog'
import { useUser } from '@/stores/use-user'
import {
  emptyFriendsCounts,
  friendsTotal as sumFriendsCounts,
  getTopGrade,
  type FriendsCounts,
} from '@/utils/friends-rating'
import type { MediaCardItem } from '@/components/media/media-card.types'

const props = defineProps<{ item: MediaCardItem }>()

const { isLoggedIn, isRealAdmin } = storeToRefs(useUser())
const loginDialog = useLoginDialog()
const { gradeTags } = useBadgeSelect()
const { rateRecord, unrateRecord } = useRating()
const ratingPending = ref(false)

const friendsCounts = computed<FriendsCounts>(
  () => (props.item.friendsCounts as FriendsCounts | null | undefined) ?? emptyFriendsCounts(),
)
const friendsTotalCount = computed(
  () => props.item.friendsTotal ?? sumFriendsCounts(friendsCounts.value),
)
const friendsCaption = computed(() =>
  friendsTotalCount.value > 0 ? `Друзья · ${friendsTotalCount.value}` : 'Оценок пока нет',
)
const friendsTop = computed(() => props.item.friendsTop ?? getTopGrade(friendsCounts.value))
const myGrade = computed(() => props.item.myGrade ?? null)
const profileVote = computed(() =>
  props.item.userGrade && props.item.userLogin
    ? { emoji: gradeTags[props.item.userGrade].name, login: props.item.userLogin }
    : null,
)

async function handleFriendsRate(grade: RecordGrade) {
  if (isRealAdmin.value) {
    toast('Твоя оценка — плашка выше', {
      description: 'Кнопки друзей — для пользователей',
    })
    return
  }
  if (!isLoggedIn.value) {
    loginDialog.open()
    return
  }
  if (ratingPending.value) return
  ratingPending.value = true
  try {
    if (myGrade.value === grade) await unrateRecord(props.item.id)
    else await rateRecord({ id: props.item.id, grade })
  } catch (error) {
    console.error('Failed to save friends rating:', error)
    toast.error('Не удалось сохранить оценку')
  } finally {
    ratingPending.value = false
  }
}

const gradeButtons = GRADE_BUTTON_ORDER.map((grade) => {
  const entry = GRADE_VOCABULARY[grade]

  return {
    grade,
    emoji: entry.name,
    bg: entry.badgeClass.replace(' border', ''),
    border: entry.borderClass ?? '',
  }
})
</script>

<template>
  <div class="flex flex-col gap-1">
    <span v-if="profileVote" class="text-xs text-muted-foreground"
      >{{ profileVote.emoji }} от {{ profileVote.login }}</span
    >
    <span class="text-[11px] uppercase tracking-wide text-muted-foreground">{{
      friendsCaption
    }}</span>
    <div class="flex items-center gap-1.5">
      <button
        v-for="btn in gradeButtons"
        :key="btn.grade"
        :disabled="ratingPending"
        :title="gradeTags[btn.grade].label"
        class="flex-1 h-9 flex items-center justify-center gap-1 rounded-md border-2 text-base transition-all cursor-pointer"
        :class="[
          friendsTop === btn.grade
            ? `${btn.bg} ${btn.border}`
            : `bg-transparent ${btn.border} opacity-60 hover:opacity-100`,
          myGrade === btn.grade ? 'ring-2 ring-white/80 opacity-100' : '',
        ]"
        @click="handleFriendsRate(btn.grade)"
      >
        {{ btn.emoji
        }}<span v-if="friendsCounts[btn.grade] > 0" class="text-xs tabular-nums">{{
          friendsCounts[btn.grade]
        }}</span>
      </button>
    </div>
  </div>
</template>
