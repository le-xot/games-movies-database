<script setup lang="ts">
import { useVirtualizer } from '@tanstack/vue-virtual'
import { useEventListener, useMediaQuery, useResizeObserver } from '@vueuse/core'
import { computed, nextTick, onMounted, ref, watch, type ComponentPublicInstance } from 'vue'
import MediaCard from '@/components/media/MediaCard.vue'
import { Card } from '@/components/ui/card'
import { useScrollContainer } from '@/composables/use-scroll-container'
import { RecordEntity, RecordUpdateDTO } from '@/lib/api'

const props = defineProps<{
  items: RecordEntity[]
  isLoading: boolean
  isLoadingNext: boolean
  hasNextPage: boolean
  hasEpisodeColumn: boolean
  deleteConfirmTitle: string
}>()

const emit = defineEmits<{
  update: [{ id: number; data: RecordUpdateDTO }]
  updatePoster: [{ id: number; url: string }]
  delete: [id: number]
  loadMore: []
}>()

const gridClass =
  'w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4'

const skeletonCount = 5

const isSm = useMediaQuery('(min-width: 640px)')
const isMd = useMediaQuery('(min-width: 768px)')
const isLg = useMediaQuery('(min-width: 1024px)')
const isXl = useMediaQuery('(min-width: 1280px)')

const columns = computed(() => {
  if (isXl.value) return 5
  if (isLg.value) return 4
  if (isMd.value) return 3
  if (isSm.value) return 2
  return 1
})

const rows = computed(() => {
  const result: RecordEntity[][] = []
  for (let index = 0; index < props.items.length; index += columns.value) {
    result.push(props.items.slice(index, index + columns.value))
  }
  return result
})

const rowCount = computed(() => rows.value.length + (props.hasNextPage ? 1 : 0))

const scrollContainer = useScrollContainer()
const listRef = ref<HTMLElement | null>(null)
const scrollMargin = ref(0)

function updateScrollMargin() {
  const container = scrollContainer.value
  const list = listRef.value
  if (!container || !list) return
  scrollMargin.value =
    list.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop
}

const virtualizer = useVirtualizer(
  computed(() => ({
    count: rowCount.value,
    getScrollElement: () => scrollContainer.value,
    estimateSize: () => (columns.value === 1 ? 640 : 520),
    overscan: 4,
    scrollMargin: scrollMargin.value,
  })),
)

const virtualRows = computed(() => virtualizer.value.getVirtualItems())
const totalSize = computed(() => virtualizer.value.getTotalSize())

function measureRow(element: Element | ComponentPublicInstance | null) {
  virtualizer.value.measureElement(element as HTMLElement | null)
}

onMounted(updateScrollMargin)
watch(listRef, updateScrollMargin, { flush: 'post' })
useResizeObserver(scrollContainer, updateScrollMargin)
useResizeObserver(() => listRef.value?.parentElement, updateScrollMargin)

const LOAD_MORE_THRESHOLD = 600

function maybeLoadMore() {
  const container = scrollContainer.value
  if (!container || !props.hasNextPage || props.isLoadingNext || rows.value.length === 0) return
  const { scrollTop, clientHeight, scrollHeight } = container
  if (scrollTop + clientHeight >= scrollHeight - LOAD_MORE_THRESHOLD) {
    emit('loadMore')
  }
}

useEventListener(scrollContainer, 'scroll', maybeLoadMore, { passive: true })
watch([() => props.items.length, () => props.hasNextPage, () => props.isLoadingNext], () =>
  nextTick(maybeLoadMore),
)
</script>

<template>
  <div v-if="!items.length && isLoading" :class="gridClass">
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
  </div>

  <div v-else-if="items.length" ref="listRef" class="w-full">
    <div :style="{ height: `${totalSize}px`, position: 'relative', width: '100%' }">
      <div
        v-for="virtualRow in virtualRows"
        :key="String(virtualRow.key)"
        :data-index="virtualRow.index"
        :ref="measureRow"
        class="absolute top-0 left-0 w-full"
        :style="{ transform: `translateY(${virtualRow.start - scrollMargin}px)` }"
      >
        <div v-if="virtualRow.index < rows.length" :class="gridClass">
          <MediaCard
            v-for="item in rows[virtualRow.index]"
            :key="item.id"
            :item="item"
            :has-episode-column="hasEpisodeColumn"
            :delete-confirm-title="deleteConfirmTitle"
            @update="emit('update', $event)"
            @update-poster="emit('updatePoster', $event)"
            @delete="emit('delete', $event)"
          />
        </div>

        <div v-else :class="gridClass">
          <Card v-for="n in columns" :key="n" class="bg-[var(--n-action-color)]">
            <div class="flex flex-row sm:flex-col">
              <div
                class="w-[130px] sm:w-full flex-shrink-0 aspect-[2/3] bg-zinc-700 animate-pulse rounded-tl-[calc(var(--radius)+4px)] rounded-bl-[calc(var(--radius)+4px)] sm:rounded-bl-none sm:rounded-t-[calc(var(--radius)+4px)]"
              />
              <div class="flex flex-col gap-2 p-3 flex-1 min-w-0">
                <div class="h-4 w-3/4 bg-zinc-700 rounded animate-pulse" />
                <div class="h-3 w-1/2 bg-zinc-700 rounded animate-pulse" />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="h-24 flex items-center justify-center text-muted-foreground">No results.</div>
</template>
