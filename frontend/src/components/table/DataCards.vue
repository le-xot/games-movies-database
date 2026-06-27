<script setup lang="ts">
import { Eraser } from '@lucide/vue'
import { useDialog } from '@/components/dialog/composables/use-dialog'
import DialogButton from '@/components/dialog/DialogButton.vue'
import TableColEpisode from '@/components/table/table-col/TableColEpisode.vue'
import TableColSelect from '@/components/table/table-col/TableColSelect.vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

const { isAdmin } = useUser()
const dialog = useDialog()

const spanTwoStatuses = [RecordStatus.NOTINTERESTED, RecordStatus.QUEUE, RecordStatus.PROGRESS]

function shouldHideGrade(status?: RecordStatus): boolean {
  return spanTwoStatuses.includes(status as RecordStatus)
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

function handleGradeUpdate(id: number, value: string | undefined) {
  emit('update', { id, data: { grade: value as RecordGrade } })
}

function handleEpisodeUpdate(id: number, value: string | undefined) {
  emit('update', { id, data: { episode: value } })
}

function handleImageError(event: Event) {
  const img = event.target as HTMLImageElement
  img.style.display = 'none'
}

function getInitials(title: string): string {
  return title.slice(0, 2).toUpperCase()
}

const skeletonCount = 5
</script>

<template>
  <div class="w-full flex flex-col gap-3">
    <template v-if="isLoading">
      <Card v-for="n in skeletonCount" :key="n" class="bg-[var(--n-action-color)]">
        <div class="flex h-[120px]">
          <div
            class="w-[80px] flex-shrink-0 rounded-l-[calc(var(--radius)+4px)] bg-zinc-700 animate-pulse"
          />
          <div class="flex flex-col flex-1 gap-2 p-4">
            <div class="h-4 w-3/4 bg-zinc-700 rounded animate-pulse" />
            <div class="h-3 w-1/2 bg-zinc-700 rounded animate-pulse" />
            <div class="flex gap-2 mt-auto">
              <div class="h-6 w-16 bg-zinc-700 rounded animate-pulse" />
              <div class="h-6 w-16 bg-zinc-700 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </Card>
    </template>

    <template v-else-if="items.length">
      <Card v-for="item in items" :key="item.id" class="bg-[var(--n-action-color)] overflow-hidden">
        <div class="flex">
          <div
            v-if="item.posterUrl"
            class="relative w-[100px] flex-shrink-0 bg-gradient-to-br from-zinc-700 to-zinc-800"
          >
            <img
              :src="getImageUrl(item.posterUrl)"
              class="w-full h-full object-cover aspect-[2/3]"
              alt=""
              @error="handleImageError"
            />
          </div>
          <div
            v-else
            class="relative w-[100px] flex-shrink-0 bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center aspect-[2/3]"
          >
            <span class="text-white text-lg font-bold opacity-40">
              {{ getInitials(item.title) }}
            </span>
          </div>

          <div class="flex flex-col flex-1 min-w-0">
            <CardHeader class="pb-2 pt-3 px-4">
              <CardTitle class="text-base leading-tight truncate">
                <a
                  :href="generateWatchLink(item.link) || item.link"
                  target="_blank"
                  class="hover:underline"
                >
                  {{ item.title }}
                </a>
              </CardTitle>
            </CardHeader>

            <CardContent class="px-4 pb-3 flex flex-col gap-2">
              <div v-if="hasEpisodeColumn && item.episode" class="text-sm">
                <span class="text-muted-foreground mr-1">Серии:</span>
                <TableColEpisode
                  :episode="item.episode"
                  @update="(value) => handleEpisodeUpdate(item.id, value)"
                />
              </div>

              <div class="flex flex-wrap items-center gap-2">
                <TableColSelect
                  :value="item.status"
                  kind="status"
                  @update="(value) => handleStatusUpdate(item.id, value)"
                />
                <TableColSelect
                  v-if="!shouldHideGrade(item.status)"
                  :value="item.grade"
                  kind="grade"
                  @update="(value) => handleGradeUpdate(item.id, value)"
                />
              </div>

              <div v-if="isAdmin" class="flex justify-end mt-1">
                <DialogButton :icon="Eraser" @click="handleDelete(item)" />
              </div>
            </CardContent>
          </div>
        </div>
      </Card>
    </template>

    <div v-else class="h-24 text-center flex items-center justify-center text-muted-foreground">
      No results.
    </div>
  </div>
</template>
