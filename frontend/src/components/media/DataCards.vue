<script setup lang="ts">
import { Eraser, ExternalLink, Pencil } from '@lucide/vue'
import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import { useDialog } from '@/components/dialog/composables/use-dialog'
import BadgeSelect from '@/components/media/badge/BadgeSelect.vue'
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
import { RecordEntity, RecordGrade, RecordStatus, RecordUpdateDTO } from '@/lib/api'
import { useUser } from '@/stores/use-user'
import { generateWatchLink } from '@/utils/generate-watch-link'
import { getImageUrl } from '@/utils/image'

const props = defineProps<{
  items: RecordEntity[]
  isLoading: boolean
  hasEpisodeColumn: boolean
  deleteConfirmTitle: string
}>()

const emit = defineEmits<{
  update: [{ id: number; data: RecordUpdateDTO }]
  delete: [id: number]
}>()

const { isAdmin } = storeToRefs(useUser())
const dialog = useDialog()

const editingEpisode = ref<{ id: number; value: string } | null>(null)

function openEpisodeEdit(item: RecordEntity) {
  editingEpisode.value = { id: item.id, value: item.episode ?? '' }
}

function saveEpisodeEdit() {
  if (!editingEpisode.value) return
  emit('update', { id: editingEpisode.value.id, data: { episode: editingEpisode.value.value } })
  editingEpisode.value = null
}

const spanTwoStatuses = [RecordStatus.NOTINTERESTED, RecordStatus.QUEUE, RecordStatus.PROGRESS]

function shouldHideGrade(status?: RecordStatus): boolean {
  return spanTwoStatuses.includes(status as RecordStatus)
}

const posterStatuses = [RecordStatus.DONE, RecordStatus.UNFINISHED, RecordStatus.DROP]

function isPosterStatus(status?: RecordStatus): boolean {
  return posterStatuses.includes(status as RecordStatus)
}

function handleDelete(item: RecordEntity) {
  dialog.openDialog({
    title: props.deleteConfirmTitle,
    content: '',
    description: `Вы уверены, что хотите удалить ${item.title ? `"${item.title}"` : 'эту запись'}?`,
    onSubmit: () => emit('delete', item.id),
  })
}

function handleStatusUpdate(id: number, value: string | undefined) {
  emit('update', { id, data: { status: value as RecordStatus } })
}

function handleGradeToggle(
  id: number,
  currentGrade: RecordGrade | undefined,
  newGrade: RecordGrade,
) {
  emit('update', { id, data: { grade: currentGrade === newGrade ? (null as any) : newGrade } })
}

function handleImageError(event: Event) {
  const img = event.target as HTMLImageElement
  img.style.display = 'none'
}

function getInitials(title: string): string {
  return title.slice(0, 2).toUpperCase()
}

const gradeButtons: { grade: RecordGrade; emoji: string; bg: string; border: string }[] = [
  { grade: RecordGrade.DISLIKE, emoji: '👎', bg: 'bg-[#6e3630]', border: 'border-[#6e3630]' },
  { grade: RecordGrade.BEER, emoji: '🍺', bg: 'bg-[#89632a]', border: 'border-[#89632a]' },
  { grade: RecordGrade.LIKE, emoji: '👍', bg: 'bg-[#2b593f]', border: 'border-[#2b593f]' },
  { grade: RecordGrade.RECOMMEND, emoji: '🔥', bg: 'bg-[#28456c]', border: 'border-[#28456c]' },
]

const skeletonCount = 5
</script>

<template>
  <div
    class="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
  >
    <template v-if="!items.length && isLoading">
      <Card v-for="n in skeletonCount" :key="n" class="bg-[var(--n-action-color)]">
        <div class="flex flex-row sm:flex-col">
          <div
            class="w-[130px] sm:w-full flex-shrink-0 aspect-[2/3] bg-zinc-700 animate-pulse rounded-tl-[calc(var(--radius)+4px)] rounded-bl-[calc(var(--radius)+4px)] sm:rounded-bl-none sm:rounded-t-[calc(var(--radius)+4px)]"
          />
          <div class="flex flex-col gap-2 p-3 flex-1 min-w-0">
            <div class="h-4 w-3/4 bg-zinc-700 rounded animate-pulse" />
            <div class="h-3 w-1/2 bg-zinc-700 rounded animate-pulse" />
            <div class="flex gap-2 mt-1">
              <div class="h-6 w-10 bg-zinc-700 rounded animate-pulse" />
              <div class="h-6 w-10 bg-zinc-700 rounded animate-pulse" />
              <div class="h-6 w-10 bg-zinc-700 rounded animate-pulse" />
              <div class="h-6 w-10 bg-zinc-700 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </Card>
    </template>

    <template v-else-if="items.length">
      <Card
        v-for="item in items"
        :key="item.id"
        class="bg-[var(--n-action-color)] overflow-hidden h-full"
      >
        <div class="flex flex-row sm:flex-col h-full">
          <div
            v-if="item.posterUrl"
            class="relative w-[130px] sm:w-full flex-shrink-0 bg-gradient-to-br from-zinc-700 to-zinc-800 rounded-tl-[calc(var(--radius)+4px)] rounded-bl-[calc(var(--radius)+4px)] sm:rounded-bl-none sm:rounded-t-[calc(var(--radius)+4px)]"
          >
            <img
              :src="getImageUrl(item.posterUrl)"
              class="w-full h-full sm:h-auto object-cover aspect-[2/3] sm:aspect-[2/3] rounded-tl-[calc(var(--radius)+4px)] rounded-bl-[calc(var(--radius)+4px)] sm:rounded-bl-none sm:rounded-t-[calc(var(--radius)+4px)]"
              alt=""
              @error="handleImageError"
            />
            <div v-if="isAdmin" class="absolute top-1 left-1 z-10 flex gap-1">
              <Button
                variant="outline"
                size="icon"
                class="bg-black/40 backdrop-blur-sm border-white/40 text-white hover:text-white hover:bg-black/60"
                @click="handleDelete(item)"
              >
                <Eraser class="size-4" />
              </Button>
              <Button
                v-if="hasEpisodeColumn"
                variant="outline"
                size="icon"
                class="bg-black/40 backdrop-blur-sm border-white/40 text-white hover:text-white hover:bg-black/60"
                @click="openEpisodeEdit(item)"
              >
                <Pencil class="size-4" />
              </Button>
            </div>
            <a
              :href="item.link"
              target="_blank"
              class="absolute bottom-1 left-1 z-10 flex items-center justify-center"
            >
              <Button
                variant="outline"
                size="icon"
                class="bg-black/40 backdrop-blur-sm border-white/40 text-white hover:text-white hover:bg-black/60"
              >
                <ExternalLink class="size-4" />
              </Button>
            </a>
            <div v-if="isPosterStatus(item.status)" class="absolute bottom-1 right-1 z-10">
              <BadgeSelect
                :value="item.status"
                kind="status"
                compact
                @update="(value) => handleStatusUpdate(item.id, value)"
              />
            </div>
          </div>
          <div
            v-else
            class="relative w-[130px] sm:w-full flex-shrink-0 bg-gradient-to-br from-zinc-700 to-zinc-800 rounded-tl-[calc(var(--radius)+4px)] rounded-bl-[calc(var(--radius)+4px)] sm:rounded-bl-none sm:rounded-t-[calc(var(--radius)+4px)] flex items-center justify-center aspect-[2/3]"
          >
            <span class="text-white text-lg font-bold opacity-40">
              {{ getInitials(item.title) }}
            </span>
            <div v-if="isAdmin" class="absolute top-1 left-1 z-10 flex gap-1">
              <Button
                variant="outline"
                size="icon"
                class="bg-black/40 backdrop-blur-sm border-white/40 text-white hover:text-white hover:bg-black/60"
                @click="handleDelete(item)"
              >
                <Eraser class="size-4" />
              </Button>
              <Button
                v-if="hasEpisodeColumn"
                variant="outline"
                size="icon"
                class="bg-black/40 backdrop-blur-sm border-white/40 text-white hover:text-white hover:bg-black/60"
                @click="openEpisodeEdit(item)"
              >
                <Pencil class="size-4" />
              </Button>
            </div>
            <a
              :href="item.link"
              target="_blank"
              class="absolute bottom-1 left-1 z-10 flex items-center justify-center"
            >
              <Button
                variant="outline"
                size="icon"
                class="bg-black/40 backdrop-blur-sm border-white/40 text-white hover:text-white hover:bg-black/60"
              >
                <ExternalLink class="size-4" />
              </Button>
            </a>
            <div v-if="isPosterStatus(item.status)" class="absolute bottom-1 right-1 z-10">
              <BadgeSelect
                :value="item.status"
                kind="status"
                compact
                @update="(value) => handleStatusUpdate(item.id, value)"
              />
            </div>
          </div>

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
                :value="item.status"
                kind="status"
                @update="(value) => handleStatusUpdate(item.id, value)"
              />

              <div v-if="!shouldHideGrade(item.status)" class="flex items-center gap-1.5">
                <button
                  v-for="btn in gradeButtons"
                  :key="btn.grade"
                  class="flex-1 h-9 flex items-center justify-center rounded-md border-2 text-base transition-all"
                  :class="[
                    item.grade === btn.grade
                      ? `${btn.bg} ${btn.border}`
                      : `bg-transparent ${btn.border} opacity-60`,
                    isAdmin ? 'cursor-pointer hover:opacity-100' : 'cursor-default',
                  ]"
                  @click="isAdmin && handleGradeToggle(item.id, item.grade, btn.grade)"
                >
                  {{ btn.emoji }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </template>

    <div v-else class="col-span-full h-24 flex items-center justify-center text-muted-foreground">
      No results.
    </div>
  </div>

  <Dialog :open="!!editingEpisode" @update:open="editingEpisode = null">
    <DialogContent class="sm:max-w-[300px]">
      <DialogHeader>
        <DialogTitle>Серии</DialogTitle>
      </DialogHeader>
      <Input
        v-if="editingEpisode"
        v-model="editingEpisode.value"
        placeholder="S06E21"
        @keydown.enter="saveEpisodeEdit"
      />
      <DialogFooter>
        <Button variant="outline" @click="editingEpisode = null">Отмена</Button>
        <Button @click="saveEpisodeEdit">Сохранить</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
