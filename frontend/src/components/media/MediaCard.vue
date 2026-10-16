<script setup lang="ts">
import { Eraser, ExternalLink, Image, Pencil } from '@lucide/vue'
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import { toast } from 'vue-sonner'
import { useDialog } from '@/components/dialog/composables/use-dialog'
import BadgeSelect from '@/components/media/badge/BadgeSelect.vue'
import { useBadgeSelect } from '@/components/media/badge/composables/use-badge-select'
import MediaPoster from '@/components/media/MediaPoster.vue'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useRating } from '@/composables/use-rating'
import { RecordEntity, RecordGrade, RecordStatus, RecordUpdateDTO } from '@/lib/api'
import { useLoginDialog } from '@/stores/use-login-dialog'
import { useUser } from '@/stores/use-user'
import {
  communityTotal as sumCommunityCounts,
  emptyCommunityCounts,
  getTopGrade,
  type CommunityCounts,
} from '@/utils/community-rating'
import { generateWatchLink } from '@/utils/generate-watch-link'

const props = defineProps<{
  item: RecordEntity & { userGrade?: RecordGrade | null; userLogin?: string | null }
  hasEpisodeColumn: boolean
  deleteConfirmTitle: string
}>()

const emit = defineEmits<{
  update: [{ id: number; data: RecordUpdateDTO }]
  updatePoster: [{ id: number; url: string }]
  delete: [id: number]
}>()

const { isAdmin, isLoggedIn, isRealAdmin } = storeToRefs(useUser())
const dialog = useDialog()
const loginDialog = useLoginDialog()
const { gradeTags } = useBadgeSelect()
const { rateRecord, unrateRecord } = useRating()
const ratingPending = ref(false)

interface EditState {
  title: string
  placeholder: string
  maxWidth: string
  value: string
  save: (value: string) => void
}

const editing = ref<EditState | null>(null)

function openEpisodeEdit() {
  editing.value = {
    title: 'Серии',
    placeholder: 'S06E21',
    maxWidth: 'sm:max-w-[300px]',
    value: props.item.episode ?? '',
    save: (value) => emit('update', { id: props.item.id, data: { episode: value } }),
  }
}

function openPosterEdit() {
  editing.value = {
    title: 'Обновить постер',
    placeholder: 'https://example.com/poster.jpg',
    maxWidth: 'sm:max-w-[400px]',
    value: '',
    save: (value) => {
      if (value) emit('updatePoster', { id: props.item.id, url: value })
    },
  }
}

function saveEdit() {
  if (!editing.value) return
  editing.value.save(editing.value.value)
  editing.value = null
}

const spanTwoStatuses = [RecordStatus.NOTINTERESTED, RecordStatus.QUEUE, RecordStatus.PROGRESS]

function shouldHideGrade(status?: RecordStatus | null): boolean {
  return status !== undefined && status !== null && spanTwoStatuses.includes(status)
}

const posterStatuses = [RecordStatus.DONE, RecordStatus.UNFINISHED, RecordStatus.DROP]

function isPosterStatus(status?: RecordStatus | null): boolean {
  return status !== undefined && status !== null && posterStatuses.includes(status)
}

function handleDelete() {
  dialog.openDialog({
    title: props.deleteConfirmTitle,
    description: `Вы уверены, что хотите удалить ${props.item.title ? `"${props.item.title}"` : 'эту запись'}?`,
    onSubmit: () => emit('delete', props.item.id),
  })
}

const adminActions = computed(() => [
  { key: 'delete', icon: Eraser, handler: handleDelete },
  ...(props.hasEpisodeColumn ? [{ key: 'episode', icon: Pencil, handler: openEpisodeEdit }] : []),
  { key: 'poster', icon: Image, handler: openPosterEdit },
])

const overlayButtonClass =
  'bg-black/40 backdrop-blur-sm border-white/40 text-white hover:text-white hover:bg-black/60'

function handleStatusUpdate(value: RecordStatus | undefined) {
  emit('update', { id: props.item.id, data: { status: value } })
}

function handleGradeUpdate(value: RecordGrade | undefined) {
  emit('update', { id: props.item.id, data: { grade: value ?? null } })
}

const communityCounts = computed<CommunityCounts>(
  () =>
    (props.item.communityCounts as CommunityCounts | null | undefined) ?? emptyCommunityCounts(),
)
const communityTotalCount = computed(
  () => props.item.communityTotal ?? sumCommunityCounts(communityCounts.value),
)
const communityCaption = computed(() =>
  communityTotalCount.value > 0 ? `Комьюнити · ${communityTotalCount.value}` : 'Оценок пока нет',
)
const communityTop = computed(() => props.item.communityTop ?? getTopGrade(communityCounts.value))
const myGrade = computed(() => props.item.myGrade ?? null)
const profileVote = computed(() =>
  props.item.userGrade && props.item.userLogin
    ? { emoji: gradeTags[props.item.userGrade].name, login: props.item.userLogin }
    : null,
)

async function handleCommunityRate(grade: RecordGrade) {
  if (isRealAdmin.value) {
    toast('Твоя оценка — плашка выше', {
      description: 'Кнопки комьюнити — для пользователей',
    })
    return
  }
  if (!isLoggedIn.value) {
    loginDialog.openLogin()
    return
  }
  if (ratingPending.value) return
  ratingPending.value = true
  try {
    if (myGrade.value === grade) await unrateRecord(props.item.id)
    else await rateRecord({ id: props.item.id, grade })
  } catch (error) {
    console.error('Failed to save community rating:', error)
    toast.error('Не удалось сохранить оценку')
  } finally {
    ratingPending.value = false
  }
}

function getInitials(title: string): string {
  return title.slice(0, 2).toUpperCase()
}

const gradeOrder = [RecordGrade.DISLIKE, RecordGrade.BEER, RecordGrade.LIKE, RecordGrade.RECOMMEND]

const gradeButtons = gradeOrder.map((grade) => {
  const bg = gradeTags[grade].class?.replace(' border', '') ?? ''
  return { grade, emoji: gradeTags[grade].name, bg, border: bg.replace('bg-', 'border-') }
})
</script>

<template>
  <Card data-testid="record-card" class="bg-[var(--n-action-color)] overflow-hidden h-full">
    <div class="flex flex-row sm:flex-col h-full">
      <MediaPoster
        :url="item.posterUrl"
        :label="getInitials(item.title)"
        class="w-[130px] sm:w-full aspect-[2/3] rounded-tl-[calc(var(--radius)+4px)] rounded-bl-[calc(var(--radius)+4px)] sm:rounded-bl-none sm:rounded-t-[calc(var(--radius)+4px)]"
      >
        <div v-if="isAdmin" class="absolute top-1 left-1 z-10 flex gap-1">
          <Button
            v-for="action in adminActions"
            :key="action.key"
            :data-testid="`record-action-${action.key}`"
            variant="outline"
            size="icon"
            :class="overlayButtonClass"
            @click="action.handler()"
          >
            <component :is="action.icon" class="size-4" />
          </Button>
        </div>
        <a
          :href="item.link"
          target="_blank"
          class="absolute bottom-1 left-1 z-10 flex items-center justify-center"
        >
          <Button variant="outline" size="icon" :class="overlayButtonClass">
            <ExternalLink class="size-4" />
          </Button>
        </a>
        <div v-if="isPosterStatus(item.status)" class="absolute bottom-1 right-1 z-10">
          <BadgeSelect
            :value="item.status ?? undefined"
            kind="status"
            compact
            @update="handleStatusUpdate"
          />
        </div>
      </MediaPoster>

      <div class="flex flex-col flex-1 gap-2 p-3 min-w-0">
        <CardHeader class="p-0">
          <TooltipProvider :delay-duration="300">
            <Tooltip>
              <TooltipTrigger as-child>
                <CardTitle class="text-lg leading-tight overflow-hidden line-clamp-3">
                  <a
                    :href="generateWatchLink(item.link) || item.link"
                    target="_blank"
                    class="hover:underline"
                  >
                    {{ item.title }}
                  </a>
                </CardTitle>
              </TooltipTrigger>
              <TooltipContent side="top" class="max-w-[300px]">
                <p>{{ item.title }}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardHeader>

        <div v-if="hasEpisodeColumn && item.episode" class="text-sm">
          <span class="text-white">Серии: </span>
          <span
            v-for="(char, i) in item.episode"
            :key="i"
            :class="/^[SE]$/.test(char) ? 'text-gray-400' : 'text-white'"
            >{{ char }}</span
          >
        </div>

        <div class="mt-auto flex flex-col gap-2">
          <BadgeSelect
            v-if="!isPosterStatus(item.status)"
            :value="item.status ?? undefined"
            kind="status"
            @update="handleStatusUpdate"
          />

          <BadgeSelect
            v-if="!shouldHideGrade(item.status)"
            :value="item.grade ?? undefined"
            kind="grade"
            @update="handleGradeUpdate"
          />

          <div class="flex flex-col gap-1">
            <span v-if="profileVote" class="text-xs text-muted-foreground"
              >{{ profileVote.emoji }} от {{ profileVote.login }}</span
            >
            <span class="text-[11px] uppercase tracking-wide text-muted-foreground">{{
              communityCaption
            }}</span>
            <div class="flex items-center gap-1.5">
              <button
                v-for="btn in gradeButtons"
                :key="btn.grade"
                :disabled="ratingPending"
                :title="gradeTags[btn.grade].label"
                class="flex-1 h-9 flex items-center justify-center gap-1 rounded-md border-2 text-base transition-all cursor-pointer"
                :class="[
                  communityTop === btn.grade
                    ? `${btn.bg} ${btn.border}`
                    : `bg-transparent ${btn.border} opacity-60 hover:opacity-100`,
                  myGrade === btn.grade ? 'ring-2 ring-white/80 opacity-100' : '',
                ]"
                @click="handleCommunityRate(btn.grade)"
              >
                {{ btn.emoji
                }}<span v-if="communityCounts[btn.grade] > 0" class="text-xs tabular-nums">{{
                  communityCounts[btn.grade]
                }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Card>

  <Dialog :open="!!editing" @update:open="editing = null">
    <DialogContent :class="editing?.maxWidth">
      <DialogHeader>
        <DialogTitle>{{ editing?.title }}</DialogTitle>
      </DialogHeader>
      <Input
        v-if="editing"
        v-model="editing.value"
        :placeholder="editing.placeholder"
        @keydown.enter="saveEdit"
      />
      <DialogFooter>
        <Button variant="outline" @click="editing = null">Отмена</Button>
        <Button @click="saveEdit">Сохранить</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
