<script setup lang="ts">
import { Search } from '@lucide/vue'
import { storeToRefs } from 'pinia'
import { computed, nextTick, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useDbNavigation } from '@/components/layout/db/use-db-navigation'
import { useBadgeSelect } from '@/components/media/badge/composables/use-badge-select'
import { useCommandPaletteHotkey } from '@/components/palette/composables/use-command-palette-hotkey'
import { useCommandPaletteSearch } from '@/components/palette/composables/use-command-palette-search'
import { PALETTE_SHORTCUT_HINT } from '@/components/palette/constants/palette-constants'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { GENRE_LABELS } from '@/pages/stats/constants/stats-constants'
import { useCommandPalette } from '@/stores/use-command-palette'
import { generateWatchLink } from '@/utils/generate-watch-link'
import { getImageUrl } from '@/utils/image'
import type { RouteItem } from '@/components/layout/db/use-db-navigation'
import type { RecordEntity, RecordGrade } from '@/lib/api'

interface PaletteCommandItem {
  kind: 'command'
  command: RouteItem
}

interface PaletteRecordItem {
  kind: 'record'
  record: RecordEntity
}

type PaletteItem = PaletteCommandItem | PaletteRecordItem

const router = useRouter()
const palette = useCommandPalette()
const { isOpen } = storeToRefs(palette)
const { sections, bottomItems } = useDbNavigation()
const { gradeTags } = useBadgeSelect()

const commands = computed<RouteItem[]>(() => [
  ...sections.value.flatMap((section) => section.items),
  ...bottomItems.value,
])

const { query, commandResults, records, isLoading, isSearching } = useCommandPaletteSearch({
  isOpen,
  commands,
})

const items = computed<PaletteItem[]>(() => [
  ...commandResults.value.map((command): PaletteItem => ({ kind: 'command', command })),
  ...records.value.map((record): PaletteItem => ({ kind: 'record', record })),
])

const activeIndex = ref(0)

watch(items, () => {
  activeIndex.value = 0
})

const isActive = (index: number) => index === activeIndex.value

const inputRef = ref<InstanceType<typeof Input> | null>(null)
const listRef = ref<HTMLElement | null>(null)

watch(isOpen, async (open) => {
  if (!open) return
  await nextTick()
  inputRef.value?.$el?.focus()
})

watch(activeIndex, async () => {
  await nextTick()
  listRef.value?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' })
})

function handleOpenChange(open: boolean) {
  if (!open) palette.closePalette()
}

function moveActive(delta: number) {
  const total = items.value.length
  if (total === 0) return
  activeIndex.value = (activeIndex.value + delta + total) % total
}

function selectAt(index: number) {
  const item = items.value[index]
  if (!item) return

  palette.closePalette()

  if (item.kind === 'command') {
    void router.push(item.command.path)
    return
  }

  window.open(generateWatchLink(item.record.link) || item.record.link, '_blank', 'noopener')
}

function handleInputKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    moveActive(1)
    return
  }

  if (event.key === 'ArrowUp') {
    event.preventDefault()
    moveActive(-1)
    return
  }

  if (event.key === 'Enter') {
    event.preventDefault()
    selectAt(activeIndex.value)
  }
}

useCommandPaletteHotkey()

const initials = (title: string) => title.slice(0, 2).toUpperCase()
const genreLabel = (genre: RecordEntity['genre']) => (genre ? GENRE_LABELS[genre] : '')
const gradeChipClass = (grade: RecordGrade) => gradeTags[grade].class?.replace(' border', '')
const gradeTitle = (grade: RecordGrade) => gradeTags[grade].label ?? ''

const emptyText = computed(() => {
  if (isLoading.value) return 'Ищем…'
  return isSearching.value ? 'Ничего не нашлось' : 'Пока пусто'
})
</script>

<template>
  <Dialog :open="isOpen" @update:open="handleOpenChange">
    <DialogContent class="top-[12%] translate-y-0 gap-0 overflow-hidden p-0 sm:max-w-xl">
      <DialogTitle class="sr-only">Поиск по кладовке</DialogTitle>
      <DialogDescription class="sr-only">
        Начните вводить название или выберите страницу
      </DialogDescription>

      <div class="flex items-center gap-2 border-b border-border px-4">
        <Search class="size-4 shrink-0 text-muted-foreground" />
        <Input
          ref="inputRef"
          v-model="query"
          data-testid="palette-input"
          placeholder="Поиск по кладовке и страницам…"
          class="h-12 border-0 bg-transparent px-0 text-base shadow-none focus-visible:ring-0"
          @keydown="handleInputKeydown"
        />
      </div>

      <div ref="listRef" class="max-h-[min(60vh,28rem)] overflow-y-auto p-2">
        <template v-if="commandResults.length">
          <p class="px-2 pt-2 pb-1 text-xs font-medium text-muted-foreground">Страницы</p>
          <button
            v-for="(command, index) in commandResults"
            :key="command.path"
            data-testid="palette-command"
            :data-active="isActive(index)"
            class="flex w-full cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-left text-sm"
            :class="isActive(index) ? 'bg-accent text-accent-foreground' : ''"
            @click="selectAt(index)"
            @mousemove="activeIndex = index"
          >
            <component :is="command.icon" class="size-4 shrink-0 text-muted-foreground" />
            <span class="truncate">{{ command.name }}</span>
          </button>
        </template>

        <template v-if="records.length">
          <p class="px-2 pt-3 pb-1 text-xs font-medium text-muted-foreground">
            {{ isSearching ? 'Записи' : 'Недавно добавленное' }}
          </p>
          <button
            v-for="(record, index) in records"
            :key="record.id"
            data-testid="palette-record"
            :data-active="isActive(commandResults.length + index)"
            class="flex w-full cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-left text-sm"
            :class="
              isActive(commandResults.length + index) ? 'bg-accent text-accent-foreground' : ''
            "
            @click="selectAt(commandResults.length + index)"
            @mousemove="activeIndex = commandResults.length + index"
          >
            <img
              v-if="record.posterUrl"
              :src="getImageUrl(record.posterUrl, 'poster')"
              alt=""
              class="h-10 w-7 shrink-0 rounded object-cover"
            />
            <span
              v-else
              class="flex h-10 w-7 shrink-0 items-center justify-center rounded bg-muted text-[10px] font-semibold"
            >
              {{ initials(record.title) }}
            </span>
            <span class="min-w-0 flex-1">
              <span class="block truncate">{{ record.title }}</span>
              <span class="block truncate text-xs text-muted-foreground">
                {{ genreLabel(record.genre) }}
                <template v-if="record.episode"> · {{ record.episode }}</template>
              </span>
            </span>
            <span
              v-if="record.grade"
              class="shrink-0 rounded-md px-1.5 py-1 text-sm leading-none"
              :class="gradeChipClass(record.grade)"
              :title="gradeTitle(record.grade)"
            >
              {{ gradeTags[record.grade].name }}
            </span>
          </button>
        </template>

        <p
          v-if="!commandResults.length && !records.length"
          class="px-2 py-6 text-center text-sm text-muted-foreground"
        >
          {{ emptyText }}
        </p>
      </div>

      <div
        class="flex items-center justify-between border-t border-border px-4 py-2 text-[11px] text-muted-foreground"
      >
        <span>↑↓ — навигация · Enter — выбрать · Esc — закрыть</span>
        <kbd class="rounded border border-border px-1.5 py-0.5">{{ PALETTE_SHORTCUT_HINT }}</kbd>
      </div>
    </DialogContent>
  </Dialog>
</template>
